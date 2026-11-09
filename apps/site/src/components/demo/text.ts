import type { PopupText } from '../../popupText';

/** 데모 팝업에 쓰는 확장 문구 키. 빌드할 때 이 키만 확장 yml에서 골라 온다. */
export const POPUP_KEYS = [
  'step.collect',
  'step.redeem',
  'common.settings',
  'common.selectAll',
  'common.selected',
  'common.delete',
  'common.copy',
  'common.pause',
  'common.stop',
  'common.waiting',
  'common.failed',
  'common.succeeded',
  'common.redeemed',
  'common.keepsRunning',
  'common.openRedeemPage',
  'expiry.daysLeft',
  'source.introTitle',
  'source.introDescription',
  'source.loading',
  'source.load',
  'source.loadHint',
  'source.reload',
  'source.extract',
  'source.shownOfTotal',
  'source.hideClaimed',
  'source.hideExtracted',
  'source.tagNotExtracted',
  'extracting.running',
  'extracting.requesting',
  'extractDone.done',
  'extractDone.description',
  'extractDone.statOk',
  'extractDone.backToList',
  'redeem.start',
  'redeem.pendingCount',
  'redeem.pacingHint',
  'redeem.running',
  'redeem.remaining',
  'redeem.statusRunning',
  'redeem.deleteHopeless',
  'redeem.backToQueue',
  'reason.already_used.label',
  'reason.already_used.help',
] as const;

export type PopupKey = (typeof POPUP_KEYS)[number];
export type T = (key: PopupKey, vars?: Record<string, string | number>, count?: number) => string;

/**
 * 확장의 i18n.t와 같은 규칙으로 문구를 채운다.
 * `{name}` 자리는 vars로, 복수형({1, n})과 `$1` 자리는 count로 채운다.
 */
export function makeT(text: PopupText): T {
  return (key, vars = {}, count) => {
    const v = text[key];
    let s = typeof v === 'string' ? v : count === 1 ? v['1'] : v.n;
    if (count != null) s = s.replace('$1', String(count));
    return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  };
}
