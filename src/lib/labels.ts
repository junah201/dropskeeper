import type { FailReason } from './types';

export const reasonLabel: Record<FailReason, string> = {
  already_used: '이미 사용된 코드',
  already_owned: '이미 보유한 상품',
  not_redeemable: '등록할 수 없는 코드',
  invalid: '유효하지 않은 코드',
  expired: '만료된 코드',
  login_required: '로그인이 필요함',
  unknown: '알 수 없는 오류',
};

export const reasonHelp: Record<FailReason, string> = {
  already_used: '이 계정이나 다른 계정에 이미 등록된 코드예요.',
  already_owned: '이 계정에 이미 있는 상품이라 등록하지 않았어요. 코드는 아직 쓰이지 않았을 수 있어요.',
  not_redeemable: 'Battle.net이 이 코드를 받지 않았어요. 점검 중일 수 있으니 나중에 다시 시도해 보고, 계속 같으면 삭제하세요.',
  invalid: '코드가 맞지 않거나 존재하지 않아요.',
  expired: '등록 기간이 지난 코드예요.',
  login_required: 'Battle.net에 다시 로그인한 뒤 재시도하세요.',
  unknown: '잠시 후 다시 시도하거나 직접 등록해 보세요.',
};
