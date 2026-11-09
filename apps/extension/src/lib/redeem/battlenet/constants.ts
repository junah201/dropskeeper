// wxt.config.ts에서도 import하므로 순수 데이터만 둔다.

/**
 * Battle.net 상점 주소는 `https://<지역>.checkout.battle.net/shop/<언어>/checkout/...` 형식이다.
 * 지역은 kr, us, eu, tw, cn이 있는데 cn은 외부에서 접속할 수 없어 받지 않는다.
 */
export const BATTLENET_REGIONS = ['kr', 'us', 'eu', 'tw'] as const;
export type BattlenetRegion = (typeof BATTLENET_REGIONS)[number];

/**
 * 등록 결과를 화면 문구로 읽으므로 문구 표(page.ts)가 있는 언어(`ko`, `en`)의 페이지에서만 등록한다.
 */
export const BATTLENET_PAGE_LANGUAGES = ['ko', 'en'] as const;
export type BattlenetPageLanguage = (typeof BATTLENET_PAGE_LANGUAGES)[number];

/** 등록에 쓰는 상점: 지역 서버와 주소의 언어 부분 */
export interface BattlenetSite {
  region: BattlenetRegion;
  /** 주소에 들어가는 언어 그대로 (예: ko, en) */
  locale: string;
}

const checkoutOrigin = (region: BattlenetRegion) => `https://${region}.checkout.battle.net`;

export const BATTLENET_CHECKOUT_MATCHES = BATTLENET_REGIONS.map((r) => `${checkoutOrigin(r)}/*`);

export const BATTLENET_HOST_PERMISSIONS = [
  ...BATTLENET_CHECKOUT_MATCHES,
  // 로그인 페이지로 넘어갔는지 탭 주소로 알아내는 데 필요하다
  ...BATTLENET_REGIONS.map((r) => `https://${r}.account.battle.net/*`),
  'https://account.battle.net/*',
];

const CHECKOUT_RE = new RegExp(`^https://(${BATTLENET_REGIONS.join('|')})\\.checkout\\.battle\\.net/shop/([^/?#]+)/checkout/([^?#]*)`, 'i');

function parseCheckout(url: string | undefined) {
  const m = url ? CHECKOUT_RE.exec(url) : null;
  if (!m) return undefined;
  return { site: { region: m[1]!.toLowerCase() as BattlenetRegion, locale: m[2]!.toLowerCase() }, path: m[3]! };
}

/** 탭 주소에서 상점 지역·언어를 읽는다. 지원하지 않는 언어여도 돌려준다. */
export const battlenetSite = (url: string | undefined): BattlenetSite | undefined => parseCheckout(url)?.site;

/** 상점 언어로 쓸 화면 문구 표. 문구를 모르는 언어면 undefined */
export const pageLanguageOf = (site: BattlenetSite): BattlenetPageLanguage | undefined =>
  BATTLENET_PAGE_LANGUAGES.find((l) => l === site.locale);

/** 확장 화면 언어에 맞는 기본 상점. 등록 페이지 열기 버튼에 쓴다. */
export const defaultBattlenetSite = (lang: BattlenetPageLanguage): BattlenetSite =>
  lang === 'ko' ? { region: 'kr', locale: 'ko' } : { region: 'us', locale: 'en' };

/** 등록 결과를 읽을 수 있는 상점 페이지인지 */
export const isSupportedBattlenetPage = (url: string | undefined) => {
  const site = battlenetSite(url);
  return !!site && !!pageLanguageOf(site);
};

export const keyClaimPageUrl = (site: BattlenetSite) => `${checkoutOrigin(site.region)}/shop/${site.locale}/checkout/key-claim`;

/** 코드를 쿼리에 넣으면 등록 페이지가 그 코드로 열린다 */
export const keyClaimUrl = (site: BattlenetSite, code: string) =>
  `${keyClaimPageUrl(site)}?keyCode=${encodeURIComponent(code)}&returnUrl=${encodeURIComponent(`https://${site.region}.shop.battle.net/`)}`;

const pathOf = (url: string | undefined) => parseCheckout(url)?.path;

export const isKeyClaimPage = (url: string | undefined) => pathOf(url)?.startsWith('key-claim') ?? false;

/**
 * 등록할 수 없는 코드(이미 등록됨, 유효하지 않음 등)의 결과 페이지. 오류는 배너로 보인다.
 * 예: /shop/ko/checkout/key-lookup/a2N8ZDVhNjFlMDB8OE45Vi1HQkdILTVENkpQLVQ2UDktVkZIOQ==
 */
export const isKeyLookupPage = (url: string | undefined) => pathOf(url)?.startsWith('key-lookup/') ?? false;

/**
 * 유효한 코드면 key-lookup 대신 이 확인 페이지로 간다. 상품 이름과 계정이 보이고 "확인" 버튼이 있다.
 * "확인"은 일반 `<form method="post">` 제출이라 같은 주소로 csrftoken만 POST된다.
 * 예: /shop/ko/checkout/confirm-key-claim/a2N8YzcyY2FkZTd8...
 */
export const isConfirmKeyClaimPage = (url: string | undefined) => pathOf(url)?.startsWith('confirm-key-claim/') ?? false;

/** 코드 등록 흐름에 속한 페이지 (입력, 확인, 결과 페이지) */
export const isKeyFlowPage = (url: string | undefined) => isKeyClaimPage(url) || isConfirmKeyClaimPage(url) || isKeyLookupPage(url);

/**
 * 확인·결과 페이지 주소에 들어 있는 코드를 꺼낸다.
 * 마지막 경로가 base64로 인코딩된 `kc|<식별자>|<코드>` 형식이다.
 */
export function keyLookupCode(url: string | undefined): string | undefined {
  if (!isKeyLookupPage(url) && !isConfirmKeyClaimPage(url)) return undefined;
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

const LOGIN_RE = new RegExp(`^https://(?:(?:${BATTLENET_REGIONS.join('|')})\\.)?account\\.battle\\.net/login`, 'i');
export const isBattlenetLoginPage = (url: string | undefined) => !!url && LOGIN_RE.test(url);
export const isBattlenetCheckout = (url: string | undefined) =>
  !!url && BATTLENET_REGIONS.some((r) => url.toLowerCase().startsWith(`${checkoutOrigin(r)}/`));

/** 코드 사이 대기 시간 (ms). 서버 부담과 속도 제한을 피하려고 무작위로 둔다. */
export const REDEEM_DELAY_MIN = 500;
export const REDEEM_DELAY_MAX = 1000;
/** 확인 버튼을 누른 뒤 결과를 기다리는 최대 시간 */
export const RESULT_TIMEOUT = 20000;
/** 드롭스 코드 추출 요청 사이 간격 */
export const EXTRACT_DELAY = 400;
