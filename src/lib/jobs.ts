/**
 * background에서 도는 작업 실행기.
 * 코드 추출(드롭스 플랫폼 탭)과 코드 등록(Battle.net 탭)을 큐 하나로 처리하고,
 * 진행 상태는 모두 storage에 남겨 팝업이 닫혀도 이어서 볼 수 있게 한다.
 */
import { sendToTab } from './messages';
import { jobItem, patchJob, patchReward, rewardsItem } from './storage';
import type { FailReason, Job, RewardEntry, RewardKey } from './types';
import type { BnetPageState } from './redeem/battlenet/page';
import {
  EXTRACT_DELAY,
  REDEEM_DELAY_MAX,
  REDEEM_DELAY_MIN,
  RESULT_TIMEOUT,
  isBattlenetLoginPage,
  isKeyFlowPage,
  keyClaimUrl,
  keyLookupCode,
  sameCode,
} from './redeem/battlenet/constants';

const MAX_CONSECUTIVE_UNKNOWN = 3;
/** 코드 하나를 등록하면서 누를 수 있는 버튼 수 (무한 반복 방지) */
const MAX_CLICKS = 3;

class Pause extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 작업이 멈추면 바로 깨어나는 대기 */
async function wait(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await sleep(Math.min(250, end - Date.now()));
    const j = await jobItem.getValue();
    if (j?.status !== 'running') return false;
  }
  return true;
}

function waitForTabComplete(tabId: number, timeout = 30000): Promise<Browser.tabs.Tab> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(on);
      reject(new Error('페이지가 열리지 않았어요.'));
    }, timeout);
    const on = (id: number, info: Browser.tabs.OnUpdatedInfo, tab: Browser.tabs.Tab) => {
      if (id !== tabId || info.status !== 'complete') return;
      clearTimeout(timer);
      browser.tabs.onUpdated.removeListener(on);
      resolve(tab);
    };
    browser.tabs.onUpdated.addListener(on);
  });
}

async function tabUrl(tabId: number) {
  try {
    return (await browser.tabs.get(tabId)).url;
  } catch {
    throw new Pause('작업하던 탭이 닫혔어요.');
  }
}

/** content script가 아직 준비되지 않았을 수 있어 몇 번 다시 묻는다 */
async function inspect(tabId: number): Promise<BnetPageState | undefined> {
  try {
    return await sendToTab(tabId, { type: 'bnet/inspect' });
  } catch {
    return undefined;
  }
}

type Outcome = { ok: true; message?: string } | { ok: false; reason: FailReason; message?: string };

async function redeemOne(tabId: number, code: string): Promise<Outcome> {
  await browser.tabs.update(tabId, { url: keyClaimUrl(code) });
  await waitForTabComplete(tabId).catch(() => undefined);

  // 등록은 여러 화면을 거친다: 입력(key-claim) → 결과(key-lookup) → (유효한 코드면) 받기 확인.
  // 같은 화면에서 버튼을 두 번 누르지 않도록 누른 화면 주소를 기억한다.
  const clickedOn = new Set<string>();
  const deadline = Date.now() + RESULT_TIMEOUT;
  let last: BnetPageState | undefined;

  while (Date.now() < deadline) {
    const url = await tabUrl(tabId);
    if (isBattlenetLoginPage(url)) throw new Pause('Battle.net 로그인이 필요해요. 로그인한 뒤 재개를 눌러 주세요.');

    // 결과 페이지 주소에는 코드가 들어 있다. 다른 코드의 결과 화면이면 아직 이동 중이므로 읽지 않는다.
    const lookupCode = keyLookupCode(url);
    const ours = !lookupCode || sameCode(lookupCode, code);
    const state: BnetPageState | undefined = ours && (isKeyFlowPage(url) || clickedOn.size > 0) ? await inspect(tabId) : undefined;
    if (state) last = state;

    switch (state?.kind) {
      case 'error':
        return { ok: false, reason: state.reason, message: state.message };
      case 'success':
        return { ok: true, message: state.message };
      case 'confirm':
        if (url && !clickedOn.has(url) && clickedOn.size < MAX_CLICKS) {
          const r = await sendToTab(tabId, { type: 'bnet/confirm' }).catch(() => ({ clicked: false }));
          if (r.clicked) clickedOn.add(url);
        }
        break;
    }
    await sleep(500);
  }
  const clicked = clickedOn.size > 0;

  return {
    ok: false,
    reason: 'unknown',
    message: clicked
      ? '확인 버튼을 눌렀지만 결과를 확인하지 못했어요.'
      : last?.kind === 'unknown'
        ? `화면을 해석하지 못했어요: ${last.message}`
        : '등록 화면을 찾지 못했어요.',
  };
}

async function processRedeem(job: Job, key: RewardKey, r: RewardEntry, unknownStreak: { n: number }) {
  if (!r.code) {
    await patchReward(key, () => ({ redeem: { status: 'failed', reason: 'unknown', message: '추출된 코드가 없어요.', at: Date.now() } }));
    return;
  }
  await patchReward(key, () => ({ redeem: { status: 'running' } }));
  let out: Outcome;
  try {
    out = await redeemOne(job.tabId, r.code);
  } catch (e) {
    await patchReward(key, () => ({ redeem: { status: 'idle' } }));
    throw e;
  }
  await patchReward(key, () => ({
    redeem: out.ok
      ? { status: 'success', message: out.message, at: Date.now() }
      : { status: 'failed', reason: out.reason, message: out.message, at: Date.now() },
  }));
  unknownStreak.n = !out.ok && out.reason === 'unknown' ? unknownStreak.n + 1 : 0;
  if (unknownStreak.n >= MAX_CONSECUTIVE_UNKNOWN) {
    throw new Pause(`알 수 없는 오류가 ${MAX_CONSECUTIVE_UNKNOWN}번 연속으로 나서 멈췄어요. 페이지 상태를 확인해 주세요.`);
  }
}

async function processExtract(job: Job, key: RewardKey, r: RewardEntry) {
  let res;
  try {
    res = await sendToTab(job.tabId, { type: 'source/extract', reward: r });
  } catch {
    throw new Pause('드롭스 페이지와 연결이 끊겼어요. 인벤토리 페이지를 다시 열어 주세요.');
  }
  if (res.ok) {
    await patchReward(key, () => ({ code: res.code, campaign: res.campaign ?? r.campaign, extractError: undefined }));
  } else if (res.kind === 'login_required') {
    throw new Pause(res.error);
  } else {
    await patchReward(key, () => ({ extractError: res.error }));
  }
}

let looping = false;

export async function runLoop() {
  if (looping) return;
  looping = true;
  const unknownStreak = { n: 0 };
  try {
    for (;;) {
      const job = await jobItem.getValue();
      if (!job || job.status !== 'running') return;
      if (job.index >= job.queue.length) {
        await patchJob(() => ({ status: 'done', current: undefined, nextAt: undefined }));
        return;
      }

      const key = job.queue[job.index]!;
      await patchJob(() => ({ current: key, nextAt: undefined }));
      const r = (await rewardsItem.getValue())[key];

      try {
        if (r) {
          if (job.kind === 'extract') await processExtract(job, key, r);
          else await processRedeem(job, key, r, unknownStreak);
        }
      } catch (e) {
        if (e instanceof Pause) {
          await patchJob(() => ({ status: 'paused', pauseReason: e.message, current: undefined }));
          return;
        }
        throw e;
      }

      const next = await patchJob((j) => ({ index: j.index + 1, current: undefined }));
      if (!next || next.status !== 'running' || next.index >= next.queue.length) continue;

      const delay =
        job.kind === 'extract' ? EXTRACT_DELAY : REDEEM_DELAY_MIN + Math.random() * (REDEEM_DELAY_MAX - REDEEM_DELAY_MIN);
      await patchJob(() => ({ nextAt: Date.now() + delay }));
      if (!(await wait(delay))) return;
    }
  } catch (e) {
    await patchJob(() => ({ status: 'paused', pauseReason: e instanceof Error ? e.message : String(e), current: undefined }));
  } finally {
    looping = false;
  }
}

export async function startJob(kind: Job['kind'], tabId: number, keys: RewardKey[]) {
  const cur = await jobItem.getValue();
  if (cur && (cur.status === 'running' || (cur.status === 'paused' && looping))) {
    throw new Error('이미 진행 중인 작업이 있어요.');
  }
  await jobItem.setValue({ kind, status: 'running', tabId, queue: keys, index: 0, startedAt: Date.now() });
  void runLoop();
}

/** 서비스 워커가 다시 켜졌을 때 '진행 중'으로 남은 작업을 일시정지로 바꾼다 */
export async function recoverJob() {
  const j = await jobItem.getValue();
  if (j?.status === 'running' && !looping) {
    await patchJob(() => ({ status: 'paused', pauseReason: '작업이 중간에 끊겼어요. 재개를 눌러 이어서 진행하세요.', current: undefined }));
  }
}
