// wxt.config.ts에서도 import하므로 순수 데이터만 둔다.

export const BATTLENET_CHECKOUT_ORIGIN = 'https://kr.checkout.battle.net';
export const BATTLENET_KEY_CLAIM_URL = `${BATTLENET_CHECKOUT_ORIGIN}/shop/ko/checkout/key-claim`;

export const BATTLENET_HOST_PERMISSIONS = ['https://kr.checkout.battle.net/*', 'https://kr.account.battle.net/*'];

/** 코드를 쿼리에 넣으면 등록 페이지가 그 코드로 열린다 */
export const keyClaimUrl = (code: string) =>
  `${BATTLENET_KEY_CLAIM_URL}?keyCode=${encodeURIComponent(code)}&returnUrl=${encodeURIComponent('https://kr.shop.battle.net/')}`;

export const isKeyClaimPage = (url: string | undefined) => !!url?.startsWith(BATTLENET_KEY_CLAIM_URL);

/**
 * 코드를 제출하면 이동하는 결과 페이지. 오류(이미 등록됨, 유효하지 않음)도 이 페이지에 표시된다.
 * 예: /shop/ko/checkout/key-lookup/a2N8ZDVhNjFlMDB8OE45Vi1HQkdILTVENkpQLVQ2UDktVkZIOQ==
 */
export const BATTLENET_KEY_LOOKUP_URL = `${BATTLENET_CHECKOUT_ORIGIN}/shop/ko/checkout/key-lookup/`;
export const isKeyLookupPage = (url: string | undefined) => !!url?.startsWith(BATTLENET_KEY_LOOKUP_URL);

/** 코드 등록 흐름에 속한 페이지 (입력 페이지 또는 결과 페이지) */
export const isKeyFlowPage = (url: string | undefined) => isKeyClaimPage(url) || isKeyLookupPage(url);

/**
 * 결과 페이지 주소에 들어 있는 코드를 꺼낸다.
 * 마지막 경로가 base64로 인코딩된 `kc|<식별자>|<코드>` 형식이다.
 */
export function keyLookupCode(url: string | undefined): string | undefined {
  if (!isKeyLookupPage(url)) return undefined;
  try {
    const seg = decodeURIComponent(new URL(url!).pathname.split('/').pop() ?? '');
    const parts = atob(seg).split('|');
    return parts[parts.length - 1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** 하이픈·대소문자 차이를 무시하고 같은 코드인지 비교한다 */
export const sameCode = (a: string, b: string) => a.replace(/[^0-9a-z]/gi, '').toUpperCase() === b.replace(/[^0-9a-z]/gi, '').toUpperCase();
export const isBattlenetLoginPage = (url: string | undefined) => !!url?.startsWith('https://kr.account.battle.net/login');
export const isBattlenetCheckout = (url: string | undefined) => !!url?.startsWith(BATTLENET_CHECKOUT_ORIGIN);

/** 코드 사이 대기 시간 (ms). 서버 부담과 속도 제한을 피하려고 무작위로 둔다. */
export const REDEEM_DELAY_MIN = 3000;
export const REDEEM_DELAY_MAX = 6000;
/** 확인 버튼을 누른 뒤 결과를 기다리는 최대 시간 */
export const RESULT_TIMEOUT = 20000;
/** 드롭스 코드 추출 요청 사이 간격 */
export const EXTRACT_DELAY = 400;
