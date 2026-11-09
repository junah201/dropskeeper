import soop from './assets/soop.png';
import chzzk from './assets/chzzk.png';

// 이미지 import 값은 번들러마다 다르다. 확장(WXT·Vite)은 주소 문자열, 소개 사이트(Astro)는 { src, width, height }를 준다.
const url = (m: unknown): string => (typeof m === 'string' ? m : (m as { src: string }).src);

/** 플랫폼 아이콘. 외부 요청 없이 번들한 파비콘을 쓴다. 키는 확장의 SourceId와 같다. */
export const sourceIcons = { soop: url(soop), chzzk: url(chzzk) } as const;
