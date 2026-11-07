import type { FailReason } from "./types";

// Battle.net 화면에서 직접 확인한 실패 4가지만 이유를 붙인다. 나머지는 모두 unknown이다.
export const reasonLabel: Record<FailReason, string> = {
  already_used: "이미 사용된 코드",
  already_owned: "이미 보유한 상품",
  not_redeemable: "등록할 수 없는 코드",
  product_unavailable: "등록할 수 없는 상품",
  unknown: "알 수 없는 오류",
};

export const reasonHelp: Record<FailReason, string> = {
  already_used: "이미 한 번 등록된 코드예요. 다시 시도해도 등록되지 않아요.",
  already_owned: "이 계정에 이미 있는 상품이에요.",
  not_redeemable: "점검 중일 수 있어요. 나중에 다시 시도해 보세요.",
  product_unavailable:
    "Battle.net이 이유를 알려 주지 않았어요. 직접 등록해 보세요.",
  unknown: "아래 원문을 확인하고 다시 시도하거나 직접 등록해 보세요.",
};

/** 저장된 이유를 지금 쓰는 이유로 맞춘다. 예전 버전이 남긴 이유(invalid 등)는 unknown으로 본다. */
export const failReasonOf = (reason: string | undefined): FailReason =>
  reason && reason in reasonLabel ? (reason as FailReason) : "unknown";
