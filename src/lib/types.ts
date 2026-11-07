/** 드롭스를 받아오는 플랫폼. CHZZK 같은 새 플랫폼은 여기에 id를 추가하고 sources/에 구현을 넣는다. */
export type SourceId = 'soop';

/** 코드를 등록하는 곳. 지금은 Battle.net 하나. */
export type RedeemTargetId = 'battlenet';

/** 플랫폼 구분 없이 정규화한 게임 id */
export type GameId = 'overwatch';

/** 각 플랫폼이 돌려주는 보상 한 건 (정규화된 형태) */
export interface SourceReward {
  sourceId: SourceId;
  /** 플랫폼 안에서 고유한 id (SOOP은 itemCodeIdx) */
  rewardId: string;
  name: string;
  game: GameId;
  redeemTarget: RedeemTargetId;
  imageUrl?: string;
  /** 드롭스 캠페인 이름. 목록 API에 없으면 코드 추출 때 채워진다. */
  campaign?: string;
  acquiredAt?: string;
  expiresAt?: string;
  /** 플랫폼에서 이미 코드를 받아 간(획득 완료) 보상. dropkeeper 밖에서 받은 것도 포함된다. */
  claimed?: boolean;
  /** 코드 추출에 필요한 플랫폼별 추가 값 (SOOP은 itemIdx) */
  extra: Record<string, string>;
}

/** 저장소 전체에서 고유한 키: `${sourceId}:${rewardId}` */
export type RewardKey = `${SourceId}:${string}`;

export const rewardKey = (r: Pick<SourceReward, 'sourceId' | 'rewardId'>): RewardKey =>
  `${r.sourceId}:${r.rewardId}`;

export type FailReason = 'already_used' | 'invalid' | 'expired' | 'login_required' | 'unknown';

export type RedeemStatus = 'idle' | 'running' | 'success' | 'failed';

export interface RedeemState {
  status: RedeemStatus;
  reason?: FailReason;
  /** 사이트에 표시된 원문 메시지 */
  message?: string;
  at?: number;
}

/** 저장소에 보관하는 보상 한 건 */
export interface RewardEntry extends SourceReward {
  code?: string;
  extractError?: string;
  redeem: RedeemState;
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
  pauseReason?: string;
  /** 다음 항목을 시작할 예정 시각 (등록 간격 표시용) */
  nextAt?: number;
  startedAt: number;
}

export const isDefined = <T,>(v: T | undefined | null): v is T => v != null;
