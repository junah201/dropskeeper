// wxt.config.ts에서도 import하므로 순수 데이터만 둔다.

export const BATTLENET_CHECKOUT_ORIGIN = 'https://kr.checkout.battle.net';
export const BATTLENET_KEY_CLAIM_URL = `${BATTLENET_CHECKOUT_ORIGIN}/shop/ko/checkout/key-claim`;

export const BATTLENET_HOST_PERMISSIONS = ['https://kr.checkout.battle.net/*', 'https://kr.account.battle.net/*'];

/** 코드를 쿼리에 넣으면 등록 페이지가 그 코드로 열린다 */
export const keyClaimUrl = (code: string) =>
  `${BATTLENET_KEY_CLAIM_URL}?keyCode=${encodeURIComponent(code)}&returnUrl=${encodeURIComponent('https://kr.shop.battle.net/')}`;

export const isKeyClaimPage = (url: string | undefined) => !!url?.startsWith(BATTLENET_KEY_CLAIM_URL);
export const isBattlenetLoginPage = (url: string | undefined) => !!url?.startsWith('https://kr.account.battle.net/login');
export const isBattlenetCheckout = (url: string | undefined) => !!url?.startsWith(BATTLENET_CHECKOUT_ORIGIN);

/** 코드 사이 대기 시간 (ms). 서버 부담과 속도 제한을 피하려고 무작위로 둔다. */
export const REDEEM_DELAY_MIN = 3000;
export const REDEEM_DELAY_MAX = 6000;
/** 확인 버튼을 누른 뒤 결과를 기다리는 최대 시간 */
export const RESULT_TIMEOUT = 20000;
/** SOOP 코드 추출 요청 사이 간격 */
export const EXTRACT_DELAY = 400;
