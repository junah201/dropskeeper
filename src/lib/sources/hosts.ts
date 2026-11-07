import type { SourceId } from '../types';
import type { SourceMeta } from './types';

// wxt.config.ts에서도 import하므로 브라우저 API를 쓰지 않는 순수 데이터만 둔다.
export const sourceMetas: Record<SourceId, SourceMeta> = {
  soop: {
    id: 'soop',
    name: 'SOOP',
    inventoryUrl: 'https://drops.sooplive.com/inventory',
    matches: ['https://drops.sooplive.com/*'],
  },
  // chzzk: { id: 'chzzk', name: 'CHZZK', inventoryUrl: '...', matches: ['...'] },
};

export const sourceHostPermissions = Object.values(sourceMetas).flatMap((m) => m.matches);

/** 탭 주소로 어느 플랫폼 페이지인지 알아낸다 */
export function sourceIdFromUrl(url: string | undefined): SourceId | undefined {
  if (!url) return undefined;
  return Object.values(sourceMetas).find((m) => m.matches.some((p) => matchPattern(p, url)))?.id;
}

function matchPattern(pattern: string, url: string): boolean {
  const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(url);
}
