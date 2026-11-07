/**
 * Battle.net 코드 등록 페이지의 화면 상태를 읽고 확인 버튼을 누른다.
 * Battle.net 탭의 content script 안에서 실행된다.
 *
 * ⚠️ 아래 문구 패턴은 실제 화면으로 아직 검증하지 않은 추정값이다.
 *    실제 버튼·결과 문구를 확인하면 이 파일의 패턴만 고치면 된다.
 */
import type { FailReason } from '../../types';

export type BnetPageState =
  | { kind: 'loading' }
  | { kind: 'confirm'; buttonText: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; reason: FailReason; message: string }
  | { kind: 'unknown'; message: string };

/** 확인 단계에서 누를 버튼 문구 (앞쪽일수록 우선) */
const CONFIRM_TEXTS = ['코드 사용', '사용하기', '등록하기', '등록', '받기', '확인', '계속', 'Redeem', 'Claim', 'Continue', 'Confirm'];
const NEGATIVE_TEXTS = ['취소', '닫기', '돌아가기', 'Cancel', 'Back'];

const SUCCESS_PATTERNS = [/등록(이|되)/, /추가되었/, /완료/, /받았습니다/, /success/i, /redeemed/i, /added to your account/i];
const ERROR_PATTERNS: [FailReason, RegExp][] = [
  ['already_used', /이미\s*(사용|등록)|already\s+(been\s+)?(used|redeemed|claimed)/i],
  ['expired', /만료|expired/i],
  ['invalid', /유효하지|올바르지|잘못된|존재하지|찾을 수 없|invalid|not\s+valid|incorrect/i],
];

const visible = (el: Element): boolean => {
  const r = (el as HTMLElement).getBoundingClientRect?.();
  const s = getComputedStyle(el as HTMLElement);
  return !!r && r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
};

const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

function findConfirmButton(): HTMLElement | undefined {
  const buttons = [...document.querySelectorAll<HTMLElement>('button, [role="button"], input[type="submit"]')].filter(
    (b) => visible(b) && !(b as HTMLButtonElement).disabled,
  );
  for (const want of CONFIRM_TEXTS) {
    const hit = buttons.find((b) => {
      const t = textOf(b) || (b as HTMLInputElement).value || '';
      return t.includes(want) && !NEGATIVE_TEXTS.some((n) => t.includes(n));
    });
    if (hit) return hit;
  }
  return undefined;
}

/** 알림·오류 영역에 있을 법한 요소의 문구를 모은다 */
function alertTexts(): string[] {
  const sel = '[role="alert"], [role="status"], [aria-live], [class*="error" i], [class*="alert" i], [class*="success" i], [class*="message" i], h1, h2, h3';
  return [...document.querySelectorAll(sel)].filter(visible).map(textOf).filter((t) => t.length > 0 && t.length < 300);
}

export function inspectPage(): BnetPageState {
  if (document.readyState === 'loading') return { kind: 'loading' };

  const texts = alertTexts();
  for (const t of texts) {
    for (const [reason, re] of ERROR_PATTERNS) if (re.test(t)) return { kind: 'error', reason, message: t };
  }

  const btn = findConfirmButton();
  if (btn) return { kind: 'confirm', buttonText: textOf(btn) };

  for (const t of texts) if (SUCCESS_PATTERNS.some((re) => re.test(t))) return { kind: 'success', message: t };

  const body = textOf(document.body).slice(0, 200);
  return { kind: 'unknown', message: body };
}

export function clickConfirm(): boolean {
  const btn = findConfirmButton();
  if (!btn) return false;
  btn.click();
  return true;
}
