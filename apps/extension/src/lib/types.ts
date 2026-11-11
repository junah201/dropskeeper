import type { LocalText } from './i18n';
import type { BattlenetSite } from './redeem/battlenet/constants';

/** 드롭스를 받아오는 플랫폼. 새 플랫폼은 여기에 id를 추가하고 sources/에 구현을 넣는다. */
export type SourceId = 'soop' | 'chzzk';

/** 코드를 등록하는 곳. 지금은 Battle.net 하나. */
export type RedeemTargetId = 'battlenet';

/** 플랫폼 구분 없이 정규화한 게임 id */
export type GameId = 'overwatch';

/** 각 플랫폼이 돌려주는 보상 한 건 (정규화된 형태) */
export interface SourceReward {
  sourceId: SourceId;
  /** 플랫폼 안에서 고유한 id (SOOP은 itemCodeIdx, CHZZK는 rewardNo) */
  rewardId: string;
  name: string;
  game: GameId;
  redeemTarget: RedeemTargetId;
  imageUrl?: string;
  /** 드롭스 캠페인 이름. 목록 API에 없으면 코드 추출 때 채워진다. */
  campaign?: string;
  acquiredAt?: string;
  expiresAt?: string;
  /** 플랫폼에서 이미 코드를 받아 간(획득 완료) 보상. DropsKeeper 밖에서 받은 것도 포함된다. */
  claimed?: boolean;
  /** 코드 추출에 필요한 플랫폼별 추가 값 (SOOP은 itemIdx) */
  extra: Record<string, string>;
}

/** 저장소 전체에서 고유한 키: `${sourceId}:${rewardId}` */
export type RewardKey = `${SourceId}:${string}`;

export const rewardKey = (r: Pick<SourceReward, 'sourceId' | 'rewardId'>): RewardKey =>
  `${r.sourceId}:${r.rewardId}`;

/** Battle.net 등록 실패 이유. 화면에서 직접 확인한 5가지 외에는 모두 unknown이다. */
export type FailReason = 'already_used' | 'already_owned' | 'expired' | 'not_redeemable' | 'product_unavailable' | 'unknown';

export type RedeemStatus = 'idle' | 'running' | 'success' | 'failed';

export interface RedeemState {
  status: RedeemStatus;
  reason?: FailReason;
  /** 사이트에 표시된 원문 메시지, 또는 DropsKeeper가 남긴 설명 */
  message?: LocalText;
  at?: number;
}

/** 저장소에 보관하는 보상 한 건 */
export interface RewardEntry extends SourceReward {
  code?: string;
  extractError?: LocalText;
  redeem: RedeemState;
  /**
   * 사용자가 목록에서 삭제한 보상. 다시 불러와도 되살아나지 않도록 지우지 않고 표시만 남긴다.
   * 화면 어디에도 보여 주지 않는다.
   */
  dismissed?: boolean;
  updatedAt: number;
}

export type JobKind = 'extract' | 'redeem';
export type JobStatus = 'running' | 'paused' | 'done' | 'stopped';

export interface Job {
  kind: JobKind;
  status: JobStatus;
  tabId: number;
  queue: RewardKey[];
  /** 다음에 처리할 queue 위치 */
  index: number;
  current?: RewardKey;
  pauseReason?: LocalText;
  /** 코드 등록 작업이 쓰는 Battle.net 상점 (작업을 시작한 탭의 지역·언어) */
  site?: BattlenetSite;
  /** 다음 항목을 시작할 예정 시각 (등록 간격 표시용) */
  nextAt?: number;
  startedAt: number;
}

export interface Settings {
  /** 화면에 보이는 코드 가운데를 ••••로 가린다. 복사는 설정과 상관없이 전체 코드로 한다. */
  maskCodes: boolean;
}

export const defaultSettings: Settings = { maskCodes: true };

export const isDefined = <T,>(v: T | undefined | null): v is T => v != null;
