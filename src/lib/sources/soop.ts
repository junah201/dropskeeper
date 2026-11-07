import type { SourceReward } from '../types';
import { earliestDate, isExpired } from '../expiry';
import { SourceError, type DropSource } from './types';

/** SOOP 드롭스 gameNo → 정규화된 게임. 지원하는 게임만 적는다. */
const SUPPORTED_GAMES: Record<string, SourceReward['game']> = {
  '12': 'overwatch',
};

const PAGE_SIZE = 20;
const MAX_PAGES = 50;
/** 목록 페이지 요청 사이 간격 (ms). 코드 추출 간격(0.4초)과 비슷하게 둔다. */
const LIST_PAGE_DELAY = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SoopListItem {
  itemCodeIdx: string;
  itemIdx: string;
  itemName: string;
  gameNo: string;
  ingameGiveYn: 'Y' | 'N';
  image?: string;
  sendDate?: string;
  expDate?: string;
  useExpDate?: string;
  acctConn?: boolean;
  /** 'Y'면 인벤토리에서 '획득 완료'로 표시된다 (코드를 이미 받아 감) */
  useFlag?: 'Y' | 'N';
  receiveDate?: string | null;
}

interface SoopListResponse {
  result: number;
  message: string;
  totalCount?: number;
  data?: SoopListItem[];
}

interface SoopUseInfoResponse {
  result: number;
  message: string;
  data?: {
    itemCode?: string | null;
    dropsName?: string;
  };
}

async function post<T extends { result: number; message: string }>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SourceError('SOOP 서버에 연결하지 못했어요.', 'network');
  }
  if (res.status === 401 || res.status === 403) {
    throw new SourceError('SOOP에 로그인되어 있지 않아요.', 'login_required');
  }
  if (!res.ok) throw new SourceError(`SOOP 응답 오류 (HTTP ${res.status})`);

  let json: T;
  try {
    json = (await res.json()) as T;
  } catch {
    // 로그인 페이지 HTML 등이 돌아온 경우
    throw new SourceError('SOOP에 로그인되어 있지 않아요.', 'login_required');
  }
  if (json.result !== 1) throw new SourceError(json.message || 'SOOP 요청이 실패했어요.');
  return json;
}

function toReward(item: SoopListItem): SourceReward | undefined {
  const game = SUPPORTED_GAMES[item.gameNo];
  // 게임 안에서 바로 지급되거나 계정 연동형인 보상은 코드가 없다
  if (!game || item.ingameGiveYn === 'Y' || item.acctConn) return undefined;
  return {
    sourceId: 'soop',
    rewardId: item.itemCodeIdx,
    name: item.itemName,
    game,
    redeemTarget: 'battlenet',
    imageUrl: item.image,
    acquiredAt: item.sendDate,
    // 수령 기한(expDate)과 사용 기한(useExpDate) 중 하나라도 지나면 쓸 수 없으니 더 이른 쪽을 쓴다
    expiresAt: earliestDate(item.expDate, item.useExpDate),
    claimed: item.useFlag === 'Y' || !!item.receiveDate,
    extra: { itemIdx: item.itemIdx },
  };
}

export const soopSource: DropSource = {
  id: 'soop',
  name: 'SOOP',

  async listRewards() {
    const out: SourceReward[] = [];
    let seen = 0;
    for (let page = 1; ; page++) {
      // 저장소는 이 목록에 없는 보상을 지우므로, 목록을 끝까지 받지 못하면 결과를 버린다
      if (page > MAX_PAGES) throw new SourceError('보상이 너무 많아 목록을 끝까지 불러오지 못했어요.');
      if (page > 1) await sleep(LIST_PAGE_DELAY);
      const res = await post<SoopListResponse>('/api/get_drops_list.php', {
        pageNo: page,
        prePageNo: PAGE_SIZE,
        division: null,
      });
      const items = res.data ?? [];
      seen += items.length;
      for (const it of items) {
        const r = toReward(it);
        if (r && !isExpired(r)) out.push(r);
      }
      if (items.length < PAGE_SIZE || (res.totalCount != null && seen >= res.totalCount)) break;
    }
    return out;
  },

  async extractCode(reward) {
    const res = await post<SoopUseInfoResponse>('/api/get_drops_use_info.php', {
      itemCodeIdx: reward.rewardId,
      itemIdx: reward.extra.itemIdx,
    });
    const code = res.data?.itemCode?.trim();
    if (!code) throw new SourceError('응답에 코드가 없어요.');
    return { code, campaign: res.data?.dropsName };
  },
};
