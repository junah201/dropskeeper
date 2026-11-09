import type { FailReason } from './types';

// Battle.net 화면에서 직접 확인한 실패 4가지만 이유를 붙인다. 나머지는 모두 unknown이다.
// 이유별 이름과 도움말은 locales의 reason.<이유>.label / help에 있다.
const FAIL_REASONS: readonly FailReason[] = ['already_used', 'already_owned', 'not_redeemable', 'product_unavailable', 'unknown'];

/** 다시 시도해도 결과가 같은 실패. 다시 시도 대신 삭제만 보여 준다. */
export const isRetryable = (reason: FailReason): boolean => reason !== 'already_used' && reason !== 'already_owned';

/** 저장된 이유를 지금 쓰는 이유로 맞춘다. 예전 버전이 남긴 이유(invalid 등)는 unknown으로 본다. */
export const failReasonOf = (reason: string | undefined): FailReason =>
  FAIL_REASONS.includes(reason as FailReason) ? (reason as FailReason) : 'unknown';
