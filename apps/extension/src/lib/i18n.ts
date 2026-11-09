/**
 * 실행 환경 사이로 넘기는 문구.
 *
 * background·content script가 만든 문구(오류, 일시정지 이유)는 저장소에 남았다가 나중에 보이므로,
 * 번역한 문장 대신 키를 넘기고 popup이 보여 줄 때 번역한다.
 */
import { i18n, type GeneratedI18nStructure } from '#i18n';

type Structure = GeneratedI18nStructure;

export type UiLang = 'ko' | 'en';

/**
 * 지금 화면 언어. 브라우저 언어가 한국어면 ko, 그 밖에는 en(default_locale).
 * 문구 파일(locales) 밖에서 언어별로 나뉘는 것(약관 본문, 기본 Battle.net 상점)은 이 값으로 고른다.
 */
export const uiLang = (): UiLang => (i18n.t('lang') === 'ko' ? 'ko' : 'en');

/** 키로 넘길 수 있는 문구. locales의 `msg` 아래에 둔다. */
export type MessageKey = Extract<keyof Structure, `msg.${string}`>;

type Subs = Record<string, string | number>;
type SubsOf<K extends MessageKey> = Structure[K] extends { namedSubstitutions: readonly (infer N extends string)[] }
  ? [subs: Record<N, string | number>]
  : [];

/**
 * 화면에 보일 문구.
 * 문자열은 사이트가 보낸 원문(Battle.net 오류 배너, 플랫폼 API 메시지)이나 예전 버전이 저장한 문구라 그대로 보여 준다.
 */
export type LocalText = string | { key: MessageKey; subs?: Subs };

/** 키와 치환 값을 타입 검사해 LocalText를 만든다 */
export const msg = <K extends MessageKey>(key: K, ...[subs]: SubsOf<K>): LocalText => (subs ? { key, subs } : { key });

export function tx(text: LocalText): string {
  if (typeof text === 'string') return text;
  // 키와 치환 값의 짝은 msg()에서 이미 검사했다
  const t = i18n.t as unknown as (key: string, subs?: Subs) => string;
  return t(text.key, text.subs);
}

/** LocalText를 담은 오류. 메시지 응답으로 넘길 때 text가 그대로 전달된다. */
export class LocalError extends Error {
  constructor(readonly text: LocalText) {
    super(typeof text === 'string' ? text : text.key);
  }
}

export const errorText = (e: unknown): LocalText =>
  e instanceof LocalError ? e.text : e instanceof Error ? e.message : String(e);
