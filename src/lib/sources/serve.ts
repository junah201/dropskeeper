import { handleMessages, isSourceMessage, type SourceResponse } from '../messages';
import type { DropSource } from './types';
import { SourceError } from './types';

/** 플랫폼 content script의 본체. 각 플랫폼은 이 함수에 자기 구현만 넘기면 된다. */
export function serveSource(source: DropSource) {
  handleMessages(isSourceMessage, async (msg) => {
    try {
      switch (msg.type) {
        case 'source/list': {
          const rewards = await source.listRewards();
          return { ok: true, rewards } satisfies SourceResponse['source/list'];
        }
        case 'source/extract': {
          const r = await source.extractCode(msg.reward);
          return { ok: true, ...r } satisfies SourceResponse['source/extract'];
        }
      }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        kind: e instanceof SourceError ? e.kind : undefined,
      };
    }
  });
}
