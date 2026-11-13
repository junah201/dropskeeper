import type { RewardEntry, RewardKey, SourceId } from './types';
import { isExpired, parseDate } from './expiry';
import { sourceMetas } from './sources/hosts';

/** 정렬용 만료 시각. 만료일이 없으면 맨 뒤로 보낸다. */
const expiryOrder = (r: RewardEntry) => parseDate(r.expiresAt) ?? Infinity;

/** 등록 순서: 실패한 코드는 뒤로, 그 안에서는 만료가 가까운 순(만료일 없는 것은 맨 뒤), 같으면 이름순 */
export const redeemOrder = (a: RewardEntry, b: RewardEntry) =>
  Number(a.redeem.status === 'failed') - Number(b.redeem.status === 'failed') ||
  expiryOrder(a) - expiryOrder(b) ||
  a.name.localeCompare(b.name);

/**
 * 아직 등록하지 않은 코드. 툴바 배지와 Battle.net 페이지 안내가 세는 대상이다.
 * 등록 대기 목록에서 처음에 고르는 코드와 같다(실패한 코드는 빼고, 사용자가 직접 고르게 둔다).
 */
export const pendingRewards = (all: Record<RewardKey, RewardEntry>, now = Date.now()) =>
  Object.values(all)
    .filter((r) => r.code && !r.dismissed && r.redeem.status !== 'success' && r.redeem.status !== 'failed' && !isExpired(r, now))
    .sort(redeemOrder);

/**
 * 드롭스 페이지 안내가 "추출할 코드"로 세는 보상: 유효기간이 남았고 아직 추출하지 않은 것.
 * 플랫폼이 획득 여부를 알려 주면 다른 곳에서 이미 받아 간 보상은 뺀다(팝업의 "미획득만 선택"과 같다).
 */
export const extractCandidates = (all: Record<RewardKey, RewardEntry>, sourceId: SourceId, now = Date.now()) =>
  Object.values(all).filter(
    (r) =>
      r.sourceId === sourceId &&
      !r.code &&
      !r.dismissed &&
      !isExpired(r, now) &&
      !(sourceMetas[sourceId].tracksClaimed && r.claimed),
  );
