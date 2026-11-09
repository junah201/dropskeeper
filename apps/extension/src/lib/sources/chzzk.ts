import type { SourceReward } from '../types';
import { earliestDate, isExpired } from '../expiry';
import { SourceError, type DropSource } from './types';
import { msg } from '../i18n';

const NAME = 'CHZZK';
/** CHZZK는 네이버 계정으로 로그인한다 */
const LOGIN_NAME = 'NAVER';

const API = 'https://api.chzzk.naver.com/commercial';

/** CHZZK 드롭스 categoryId → 정규화된 게임. 지원하는 게임만 적는다. */
const SUPPORTED_GAMES: Record<string, SourceReward['game']> = {
  OVERWATCH: 'overwatch',
};

interface ChzzkCampaign {
  campaignNo: number;
  title: string;
  claimEndDate?: string | null;
  accountLinkUrl?: string | null;
  externalProvider?: boolean;
}

interface ChzzkClaim {
  rewardNo: number;
  campaignNo: number;
  imageUrl?: string;
  title: string;
  /** 코드형 보상은 CODE_로 시작한다 (예: CODE_FIRST_COME) */
  rewardType: string;
  /** 조건을 채운 보상은 COMPLIED */
  fulfillmentState: string;
  createdDate?: string;
  categoryId?: string;
  campaign?: ChzzkCampaign;
  codeEndDate?: string | null;
}

interface ChzzkResponse<T> {
  code: number;
  message: string | null;
  content?: T;
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new SourceError(msg('msg.serverUnreachable', { name: NAME }), 'network');
  }
  if (res.status === 401 || res.status === 403) {
    throw new SourceError(msg('msg.notLoggedIn', { name: LOGIN_NAME }), 'login_required');
  }

  let json: ChzzkResponse<T>;
  try {
    json = (await res.json()) as ChzzkResponse<T>;
  } catch {
    throw new SourceError(msg('msg.httpError', { name: NAME, status: res.status }));
  }
  if (json.code === 401 || json.code === 403) {
    throw new SourceError(msg('msg.notLoggedIn', { name: LOGIN_NAME }), 'login_required');
  }
  if (!res.ok || json.code !== 200 || json.content == null) {
    throw new SourceError(json.message || msg('msg.requestFailedCode', { name: NAME, code: json.code ?? res.status }));
  }
  return json.content;
}

function toReward(item: ChzzkClaim): SourceReward | undefined {
  const game = item.categoryId ? SUPPORTED_GAMES[item.categoryId] : undefined;
  if (!game || !item.rewardType.startsWith('CODE_')) return undefined;
  // 아직 조건을 채우지 못한 보상은 코드를 받을 수 없다
  if (item.fulfillmentState !== 'COMPLIED') return undefined;
  // 계정 연동형 보상은 코드가 없다
  if (item.campaign?.accountLinkUrl || item.campaign?.externalProvider) return undefined;
  return {
    sourceId: 'chzzk',
    rewardId: String(item.rewardNo),
    name: item.title,
    game,
    redeemTarget: 'battlenet',
    imageUrl: item.imageUrl,
    campaign: item.campaign?.title,
    acquiredAt: item.createdDate,
    // 수령 기한(claimEndDate)과 코드 사용 기한(codeEndDate) 중 더 이른 쪽을 쓴다
    expiresAt: earliestDate(item.campaign?.claimEndDate, item.codeEndDate),
    // claimed는 비워 둔다. CHZZK는 코드를 받아 갔는지 알려 주지 않는다 (tracksClaimed: false)
    extra: {},
  };
}

export const chzzkSource: DropSource = {
  id: 'chzzk',
  name: NAME,

  async listRewards() {
    // 페이지 나눔 없이 한 번에 전체 목록이 온다
    const content = await get<{ claimList?: ChzzkClaim[] }>('/v2/drops/rewards/claims');
    if (!Array.isArray(content.claimList)) throw new SourceError(msg('msg.unexpectedFormat', { name: NAME }));
    return content.claimList.map(toReward).filter((r): r is SourceReward => !!r && !isExpired(r));
  },

  async extractCode(reward) {
    // 같은 보상은 다시 불러도 같은 코드가 온다
    const content = await get<{ code?: string | null }>(
      `/v1/drops/rewards/${encodeURIComponent(reward.rewardId)}/coupon-code`,
    );
    const code = content.code?.trim();
    if (!code) throw new SourceError(msg('msg.noCodeInResponse'));
    return { code };
  },
};
