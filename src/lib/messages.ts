import type { JobKind, RewardKey, SourceReward } from './types';
import type { BnetPageState } from './redeem/battlenet/page';

export type Fail = { ok: false; error: string; kind?: string };
export type Ok<T> = { ok: true } & T;
export type Result<T = {}> = Ok<T> | Fail;

/** popup·background → 드롭스 플랫폼 탭의 content script */
export type SourceMessage =
  | { type: 'source/list' }
  | { type: 'source/extract'; reward: SourceReward };

export type SourceResponse = {
  'source/list': Result<{ rewards: SourceReward[] }>;
  'source/extract': Result<{ code: string; campaign?: string }>;
};

/** background → Battle.net 탭의 content script */
export type BnetMessage = { type: 'bnet/inspect' } | { type: 'bnet/confirm' };

export type BnetResponse = {
  'bnet/inspect': BnetPageState;
  'bnet/confirm': { clicked: boolean };
};

/** popup → background */
export type JobMessage =
  | { type: 'job/start'; kind: JobKind; tabId: number; keys: RewardKey[] }
  | { type: 'job/pause' }
  | { type: 'job/resume' }
  | { type: 'job/stop' }
  | { type: 'job/clear' };

type AnyMessage = SourceMessage | BnetMessage | JobMessage;
type ResponseOf<M extends AnyMessage> = M['type'] extends keyof SourceResponse
  ? SourceResponse[M['type']]
  : M['type'] extends keyof BnetResponse
    ? BnetResponse[M['type']]
    : Result;

export async function sendToTab<M extends SourceMessage | BnetMessage>(tabId: number, msg: M): Promise<ResponseOf<M>> {
  return (await browser.tabs.sendMessage(tabId, msg)) as ResponseOf<M>;
}

export async function sendToBackground(msg: JobMessage): Promise<Result> {
  return (await browser.runtime.sendMessage(msg)) as Result;
}

/**
 * 비동기 응답을 돌려주는 onMessage 리스너를 등록한다.
 * sendResponse + return true 방식이라 모든 Chrome 버전에서 동작한다.
 */
export function handleMessages<M extends AnyMessage>(
  accept: (msg: unknown) => msg is M,
  handler: (msg: M, sender: Browser.runtime.MessageSender) => Promise<unknown>,
) {
  browser.runtime.onMessage.addListener((msg: unknown, sender, sendResponse) => {
    if (!accept(msg)) return false;
    handler(msg, sender).then(sendResponse, (e: unknown) =>
      sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) } satisfies Fail),
    );
    return true;
  });
}

const hasType = (msg: unknown, prefix: string): boolean =>
  typeof msg === 'object' && msg !== null && typeof (msg as { type?: unknown }).type === 'string' && (msg as { type: string }).type.startsWith(prefix);

export const isSourceMessage = (m: unknown): m is SourceMessage => hasType(m, 'source/');
export const isBnetMessage = (m: unknown): m is BnetMessage => hasType(m, 'bnet/');
export const isJobMessage = (m: unknown): m is JobMessage => hasType(m, 'job/');
