import type { JobKind, RewardKey, Settings, SourceId, SourceReward } from './types';
import type { BnetPageState } from './redeem/battlenet/page';
import { errorText, type LocalText } from './i18n';

export type Fail = { ok: false; error: LocalText; kind?: string };
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

/**
 * popup·페이지 안내 카드 → background.
 * 저장소 쓰기는 모두 background에서 하도록 popup은 이 메시지로 요청만 보낸다.
 */
export type BackgroundMessage =
  | { type: 'rewards/load'; sourceId: SourceId; tabId: number }
  /** 드롭스 페이지 안내에서 보낸다. 보낸 탭에서 목록을 불러온다. */
  | { type: 'rewards/loadHere'; sourceId: SourceId }
  | { type: 'rewards/dismiss'; keys: RewardKey[] }
  | { type: 'job/start'; kind: JobKind; tabId: number; keys: RewardKey[] }
  /** Battle.net 페이지 안내에서 보낸다. 보낸 탭에서 등록 대기 코드를 모두 등록한다. */
  | { type: 'job/redeemPending' }
  /** 드롭스 페이지 안내에서 보낸다. 보낸 탭에서 추출할 코드(extractCandidates)를 모두 추출한다. */
  | { type: 'job/extractPending'; sourceId: SourceId }
  | { type: 'job/pause' }
  | { type: 'job/resume' }
  | { type: 'job/stop' }
  | { type: 'job/clear' }
  | { type: 'settings/set'; patch: Partial<Settings> }
  /** 페이지 안내 카드의 "DropsKeeper 열기". 툴바 아이콘 아래에 확장 팝업을 연다. */
  | { type: 'ui/openPopup' };

type AnyMessage = SourceMessage | BnetMessage | BackgroundMessage;
type ResponseOf<M extends AnyMessage> = M['type'] extends keyof SourceResponse
  ? SourceResponse[M['type']]
  : M['type'] extends keyof BnetResponse
    ? BnetResponse[M['type']]
    : Result;

export async function sendToTab<M extends SourceMessage | BnetMessage>(tabId: number, msg: M): Promise<ResponseOf<M>> {
  return (await browser.tabs.sendMessage(tabId, msg)) as ResponseOf<M>;
}

export async function sendToBackground(msg: BackgroundMessage): Promise<Result> {
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
      sendResponse({ ok: false, error: errorText(e) } satisfies Fail),
    );
    return true;
  });
}

const hasType = (msg: unknown, prefix: string): boolean =>
  typeof msg === 'object' && msg !== null && typeof (msg as { type?: unknown }).type === 'string' && (msg as { type: string }).type.startsWith(prefix);

export const isSourceMessage = (m: unknown): m is SourceMessage => hasType(m, 'source/');
export const isBnetMessage = (m: unknown): m is BnetMessage => hasType(m, 'bnet/');
export const isBackgroundMessage = (m: unknown): m is BackgroundMessage => hasType(m, 'job/') || hasType(m, 'rewards/') || hasType(m, 'settings/') || hasType(m, 'ui/');
