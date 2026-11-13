import type { SourceId } from '../types';
import type { SourceMeta } from './types';

// wxt.config.ts에서도 import하므로 브라우저 API를 쓰지 않는 순수 데이터만 둔다.
export const sourceMetas: Record<SourceId, SourceMeta> = {
  soop: {
    id: 'soop',
    name: 'SOOP',
    inventoryUrl: 'https://drops.sooplive.com/inventory',
    inventoryPattern: /^https:\/\/drops\.sooplive\.com\/inventory(?:[/?#]|$)/,
    matches: ['https://drops.sooplive.com/*'],
    tracksClaimed: true,
  },
  chzzk: {
    id: 'chzzk',
    name: 'CHZZK',
    inventoryUrl: 'https://game.naver.com/profile#drops',
    // 인벤토리는 프로필 페이지의 #drops 탭이다
    inventoryPattern: /^https:\/\/game\.naver\.com\/profile(?:[/?][^#]*)?#drops(?:[/?&]|$)/,
    matches: ['https://game.naver.com/*'],
    tracksClaimed: false,
  },
};

export const sourceHostPermissions = Object.values(sourceMetas).flatMap((m) => m.matches);

export function sourceIdFromUrl(url: string | undefined): SourceId | undefined {
  if (!url) return undefined;
  return Object.values(sourceMetas).find((m) => m.matches.some((p) => matchPattern(p, url)))?.id;
}

function matchPattern(pattern: string, url: string): boolean {
  const re = new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(url);
}
