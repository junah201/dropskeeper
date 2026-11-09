/**
 * Battle.net 코드 등록 페이지의 화면 상태를 읽고 확인 버튼을 누른다.
 * Battle.net 탭의 content script 안에서 실행된다.
 *
 * 실제 화면(HAR)으로 확인한 것:
 *   - `key-claim?keyCode=` 주소로 들어가면 버튼을 누르지 않아도 서버가 바로 조회까지 진행한다.
 *     key-claim?keyCode= → 302 /checkout/<b64> → 302 preload/<b64> (페이지가 deviceInfo·csrftoken을 POST)
 *     → 302 key-lookup/<b64>         (오류: 이미 등록됨, 유효하지 않음 등)
 *     → 302 confirm-key-claim/<b64>  (유효한 코드: 상품 이름·계정과 "확인" 버튼. 누르면 같은 주소로 csrftoken POST)
 *   - 오류(이미 등록됨, 유효하지 않음)는 key-lookup 페이지의
 *     `<blz-alert severity="error">` 안 `.error-notification-banner-content`에 서버가 그려서 내려준다(일반 DOM).
 *     첫 번째 <p>가 제목("이미 등록된 코드입니다."), 두 번째 <p>가 설명이다.
 *   - 오류 페이지에도 빈 코드 입력 폼과 비활성 "코드 등록" 버튼이 함께 있다.
 *   - 확인 페이지의 버튼은 `form#submit-key-claim` 안의 `<button>확인</button>`이고, 취소는 `<a>` 링크다.
 *   - "확인"을 누르면 perform-key-claim → purchase-details/key-claim/<코드>("코드 등록을 처리 중입니다.")로 가고,
 *     페이지가 2초마다 purchase-status를 확인하다 끝나면 새로고침해 "코드가 등록되었습니다."를 보여 준다.
 *     완료 화면의 "돌아가기", "다른 코드 등록"은 버튼이 아닌 <a> 링크다.
 */
import type { FailReason } from '../../types';
import { battlenetSite, pageLanguageOf, type BattlenetPageLanguage } from './constants';

export type BnetPageState =
  | { kind: 'loading' }
  | { kind: 'confirm'; buttonText: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; reason: FailReason; message: string }
  | { kind: 'unknown'; message: string };

/** 상점 언어별 화면 문구. 등록 결과를 이 문구로 판단한다. */
interface PageTexts {
  /** 확인 단계에서 누를 버튼 문구 (앞쪽일수록 우선) */
  confirm: string[];
  /** 확인 버튼으로 오인하면 안 되는 문구 */
  negative: string[];
  success: RegExp[];
  /** "확인"을 누른 뒤 서버가 처리하는 동안 보이는 화면. 페이지가 스스로 새로고침하므로 결과가 나올 때까지 기다린다. */
  processing: RegExp[];
  /** 실제 화면으로 확인한 오류 제목만 적는다. 여기에 없는 오류는 unknown으로 두고 원문을 보여 준다. */
  errors: [FailReason, RegExp][];
}

const PAGE_TEXTS: Record<BattlenetPageLanguage, PageTexts> = {
  ko: {
    confirm: ['코드 사용', '사용하기', '등록하기', '등록', '받기', '확인', '계속'],
    negative: ['취소', '닫기', '돌아가기'],
    // 실제 화면 문구: purchase-details/key-claim/<코드> 페이지의 "코드가 등록되었습니다."
    success: [/코드가\s*등록되었습니다/],
    // "잠시만 기다려주세요. 코드 등록을 처리 중입니다."
    processing: [/등록을\s*처리\s*중/],
    errors: [
      // "이미 등록된 코드입니다."
      ['already_used', /이미\s*등록된\s*코드/],
      // "이미 보유한 상품입니다."
      ['already_owned', /이미\s*보유한\s*상품/],
      // "입력한 키는 등록할 수 없습니다. … 점검 중일 수 있으니 다음에 시도해 주세요."
      ['not_redeemable', /키는\s*등록할\s*수\s*없/],
      // "해당 상품을 등록하실 수 없습니다."
      ['product_unavailable', /상품을\s*등록하실\s*수\s*없/],
    ],
  },
  // English. 실제 화면으로 확인한 문구만 적는다. 모르는 오류 배너는 unknown(원문 표시)이 된다.
  en: {
    confirm: ['Redeem', 'Claim', 'Continue', 'Confirm'],
    negative: ['Cancel', 'Close', 'Back'],
    // purchase-details/key-claim/<코드> 페이지의 "Code successfully redeemed!"
    success: [/code\s+successfully\s+redeemed/i],
    // "Give us a moment. We are processing your claim now."
    processing: [/processing\s+your\s+claim/i],
    errors: [
      // "You’ve already claimed this code." (아포스트로피가 ’라 그 앞은 맞추지 않는다)
      ['already_used', /already\s+claimed\s+this\s+code/i],
      // "You already have access to this product."
      ['already_owned', /already\s+have\s+access\s+to\s+this\s+product/i],
      // 제목은 "Oops!"이고 설명이 "The code you entered cannot be claimed. … may be undergoing maintenance."라 설명으로 맞춘다
      ['not_redeemable', /code\s+you\s+entered\s+cannot\s+be\s+claimed/i],
    ],
  },
};

/** 지금 페이지 주소의 언어에 맞는 문구 표. 모르는 언어면 확인 버튼만 찾을 수 있도록 두 언어를 합친다. */
function pageTexts(): PageTexts {
  const site = battlenetSite(location.href);
  const lang = site && pageLanguageOf(site);
  if (lang) return PAGE_TEXTS[lang];
  const all = Object.values(PAGE_TEXTS);
  return {
    confirm: all.flatMap((t) => t.confirm),
    negative: all.flatMap((t) => t.negative),
    success: all.flatMap((t) => t.success),
    processing: all.flatMap((t) => t.processing),
    errors: all.flatMap((t) => t.errors),
  };
}

const visible = (el: Element): boolean => {
  const r = (el as HTMLElement).getBoundingClientRect?.();
  const s = getComputedStyle(el as HTMLElement);
  return !!r && r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
};

const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/**
 * Battle.net 상점은 웹 컴포넌트(meka-*, blz-*)로 만들어져 있어 요소가 shadow DOM 안에 숨어 있을 수 있다.
 * document와 열린 shadow root를 모두 뒤진다.
 */
function deepAll(root: ParentNode = document): Element[] {
  const out: Element[] = [];
  for (const el of root.querySelectorAll('*')) {
    out.push(el);
    if (el.shadowRoot) out.push(...deepAll(el.shadowRoot));
  }
  return out;
}

const deepQueryAll = (selector: string) => deepAll().filter((el) => el.matches(selector));

/** 일반 버튼과 `<meka-button>` 같은 버튼 웹 컴포넌트 */
const isButtonLike = (el: Element) =>
  el.matches('button, [role="button"], input[type="submit"]') || (el.localName.includes('-') && el.localName.includes('button'));

const isDisabled = (el: Element) => (el as HTMLButtonElement).disabled === true || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';

/** 버튼에 적힌 글자. 웹 컴포넌트 안의 <button>은 글자가 slot으로 들어와 비어 있으므로 바깥 요소 글자를 쓴다. */
const labelOf = (el: Element) => textOf(el) || (el as HTMLInputElement).value || el.getAttribute('aria-label') || '';

/** 확인 페이지(confirm-key-claim)의 실제 제출 버튼 */
const KEY_CLAIM_SUBMIT = 'form#submit-key-claim button';

function findConfirmButton(): HTMLElement | undefined {
  const submit = [...document.querySelectorAll<HTMLElement>(KEY_CLAIM_SUBMIT)].find((b) => visible(b) && !isDisabled(b));
  if (submit) return submit;
  const buttons = deepAll().filter((b) => isButtonLike(b) && visible(b) && !isDisabled(b)) as HTMLElement[];
  const { confirm, negative } = pageTexts();
  for (const want of confirm) {
    const hit = buttons.find((b) => {
      const t = labelOf(b);
      return t.includes(want) && !negative.some((n) => t.includes(n));
    });
    if (hit) return hit;
  }
  return undefined;
}

/**
 * 언어와 상관없는 화면 표시 (en 페이지 HAR로 확인).
 * 완료 화면의 제목에는 `data-bnet-shop="payment.success.dynamic.purchaseDetails.keyclaim…heading…"`가 붙고,
 * 처리 중 화면의 "Give us a moment." 줄에는 `.payment-pending-state-title`이 붙는다. 문구 표보다 먼저 본다.
 */
const SUCCESS_HEADING = '[data-bnet-shop^="payment.success.dynamic.purchaseDetails.keyclaim"][data-bnet-shop*="heading"]';
const PENDING_TITLE = '.payment-pending-state-title';

const ERROR_BANNER = '.error-notification-banner-content';
/** 배너 안쪽 구조가 바뀌어도 잡을 수 있도록 바깥 요소도 본다 */
const ERROR_ALERT = 'blz-alert[severity="error"]';

/** key-lookup 페이지의 오류 배너를 읽는다. 배너가 있으면 이유를 몰라도 실패로 본다. */
function readErrorBanner(): { reason: FailReason; message: string } | undefined {
  const el =
    deepQueryAll(ERROR_BANNER).find((e) => visible(e) && textOf(e)) ?? deepQueryAll(ERROR_ALERT).find((e) => visible(e) && textOf(e));
  if (!el) return undefined;
  const lines = [...el.querySelectorAll('p')].map(textOf).filter(Boolean);
  const title = lines[0] ?? textOf(el);
  const all = textOf(el);
  const { errors } = pageTexts();
  const reason = errors.find(([, re]) => re.test(title))?.[0] ?? errors.find(([, re]) => re.test(all))?.[0] ?? 'unknown';
  // 이유를 모르는 오류는 사용자가 원문을 보고 판단하도록 배너 전체 문구를 남긴다
  return { reason, message: reason === 'unknown' ? all : title };
}

/** 알림·오류 영역에 있을 법한 요소의 문구를 모은다 */
function alertTexts(): string[] {
  const sel = '[role="alert"], [role="status"], [aria-live], [class*="error" i], [class*="alert" i], [class*="success" i], [class*="message" i], h1, h2, h3';
  return deepQueryAll(sel).filter(visible).map(textOf).filter((t) => t.length > 0 && t.length < 300);
}

export function inspectPage(): BnetPageState {
  if (document.readyState === 'loading') return { kind: 'loading' };

  const banner = readErrorBanner();
  if (banner) return { kind: 'error', ...banner };

  const { errors, success, processing } = pageTexts();
  const texts = alertTexts();
  for (const t of texts) {
    for (const [reason, re] of errors) if (re.test(t)) return { kind: 'error', reason, message: t };
  }

  // 완료 화면에서 다른 버튼을 누르지 않도록 성공 여부를 버튼보다 먼저 본다
  const heading = deepQueryAll(SUCCESS_HEADING).find((e) => visible(e) && textOf(e));
  if (heading) return { kind: 'success', message: textOf(heading) };
  if (deepQueryAll(PENDING_TITLE).some(visible)) return { kind: 'loading' };
  for (const t of texts) if (success.some((re) => re.test(t))) return { kind: 'success', message: t };
  if (texts.some((t) => processing.some((re) => re.test(t)))) return { kind: 'loading' };

  const btn = findConfirmButton();
  if (btn) return { kind: 'confirm', buttonText: labelOf(btn) };

  const body = textOf(document.body).slice(0, 200);
  return { kind: 'unknown', message: body };
}

export function clickConfirm(): boolean {
  const btn = findConfirmButton();
  if (!btn) return false;
  // 웹 컴포넌트 버튼이면 안쪽의 실제 <button>을 눌러야 폼 제출이 일어난다
  const inner = btn.shadowRoot?.querySelector<HTMLElement>('button, [role="button"], input[type="submit"]');
  (inner ?? btn).click();
  return true;
}

/** 원인 파악용: 페이지에서 찾은 버튼과 알림 문구를 모은다 */
export function describePage() {
  return {
    url: location.href,
    buttons: deepAll()
      .filter(isButtonLike)
      .map((b) => ({ tag: b.localName, label: labelOf(b), visible: visible(b), disabled: isDisabled(b) })),
    banners: deepQueryAll(`${ERROR_BANNER}, ${ERROR_ALERT}`).map(textOf),
    alerts: alertTexts(),
  };
}
