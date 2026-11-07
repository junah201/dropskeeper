import type { SourceId } from '../types';
import type { DropSource } from './types';
import { soopSource } from './soop';

/** content script에서만 쓰는 구현 레지스트리 */
export const sources: Record<SourceId, DropSource> = {
  soop: soopSource,
};

export { sourceMetas, sourceIdFromUrl } from './hosts';
export type { DropSource, SourceMeta } from './types';
