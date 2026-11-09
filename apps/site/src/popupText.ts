// 확장 팝업의 실제 문구(apps/extension/src/locales/*.yml)를 빌드할 때 읽어 온다.
// 동작 데모가 확장과 같은 문구를 보여 주도록, 사이트에 따로 옮겨 적지 않는다. (서버에서만 쓴다)
import { parse } from 'yaml';
import ko from '../../extension/src/locales/ko.yml?raw';
import en from '../../extension/src/locales/en.yml?raw';
import type { Lang } from './i18n';

/** 문구 하나. 복수형은 확장 yml처럼 { 1, n }이고 n 쪽의 $1 자리에 개수가 들어간다. */
export type PopupText = Record<string, string | { '1': string; n: string }>;

const sources: Record<Lang, string> = { ko, en };

/** 중첩된 yml을 'source.introTitle' 같은 평평한 키로 편다. 복수형({1, n})은 그대로 둔다. */
function flatten(obj: Record<string, unknown>, prefix = '', out: PopupText = {}): PopupText {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object' && 'n' in v) out[key] = v as { '1': string; n: string };
    else if (v && typeof v === 'object') flatten(v as Record<string, unknown>, key, out);
  }
  return out;
}

/** 데모에 쓰는 키만 골라 섬(island) props로 넘긴다. 없는 키가 있으면 빌드를 멈춘다. */
export function popupText(lang: Lang, keys: readonly string[]): PopupText {
  const all = flatten(parse(sources[lang]));
  return Object.fromEntries(
    keys.map((k) => {
      if (!(k in all)) throw new Error(`확장 문구에 ${k} 키가 없습니다 (${lang}.yml)`);
      return [k, all[k]];
    }),
  );
}
