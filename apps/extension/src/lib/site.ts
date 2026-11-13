import { uiLang } from './i18n';

/** 소개 사이트(apps/site) 주소. 팝업 언어에 맞는 페이지로 바로 연다. */
export const siteUrl = () => `https://dropskeeper.junah.dev/${uiLang()}/`;
