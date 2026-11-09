import type { LegalLang } from '@dropskeeper/legal';

export type Lang = LegalLang;

export const langs: readonly Lang[] = ['ko', 'en'];

/** 언어 없는 주소로 들어왔고 브라우저 언어도 알 수 없을 때 쓰는 언어 */
export const fallbackLang: Lang = 'ko';

/** 언어별 주소. path는 '' 또는 'privacy' 같은 페이지 이름 */
export const href = (lang: Lang, path = '') => `/${lang}/${path}`;

/** [lang] 페이지의 getStaticPaths */
export const langPaths = () => langs.map((lang) => ({ params: { lang } }));
/** 소개 페이지 문구. 한국어와 영어는 같은 내용을 담는다. */
export const copy = {
  ko: {
    description: '스트리밍 플랫폼 드롭스 보상 코드를 모아 Battle.net에 차례로 등록하는 브라우저 확장 프로그램',
    headline: '드롭스 보상 코드, 한 번에 등록하세요',
    lead: 'SOOP·CHZZK 드롭스 보상 코드를 모아 Battle.net에 차례로 등록합니다. 서버 없이 브라우저 안에서만 동작합니다.',
    platforms: '지원 플랫폼',
    privacy: '개인정보처리방침',
    terms: '서비스 이용약관',
    otherLang: 'English',
  },
  en: {
    description: 'A browser extension that collects drop reward codes from streaming platforms and redeems them on Battle.net one by one',
    headline: 'Redeem your drop reward codes in one go',
    lead: 'Collects SOOP and CHZZK drop reward codes and redeems them on Battle.net one by one. Runs entirely in your browser, with no server.',
    platforms: 'Supported platforms',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    otherLang: '한국어',
  },
} satisfies Record<Lang, Record<string, string>>;
