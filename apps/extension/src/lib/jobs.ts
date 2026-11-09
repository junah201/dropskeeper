/**
 * background에서 도는 작업 실행기.
 * 코드 추출(드롭스 플랫폼 탭)과 코드 등록(Battle.net 탭)을 큐 하나로 처리하고,
 * 진행 상태는 모두 storage에 남겨 팝업이 닫혀도 이어서 볼 수 있게 한다.
 */
import { sendToTab } from './messages';
import { LocalError, errorText, msg, type LocalText } from './i18n';
import { jobItem, patchJob, patchReward, rewardsItem } from './storage';
import type { FailReason, Job, RewardEntry, RewardKey } from './types';
import type { BnetPageState } from './redeem/battlenet/page';
import {
  EXTRACT_DELAY,
  REDEEM_DELAY_MAX,
  REDEEM_DELAY_MIN,
  RESULT_TIMEOUT,
  battlenetSite,
  pageLanguageOf,
  type BattlenetSite,
  isBattlenetCheckout,
  isBattlenetLoginPage,
  isKeyFlowPage,
  keyClaimUrl,
  keyLookupCode,
  sameCode,
} from './redeem/battlenet/constants';

const MAX_CONSECUTIVE_UNKNOWN = 3;
/** 코드 하나를 등록하면서 누를 수 있는 버튼 수 (무한 반복 방지) */
const MAX_CLICKS = 3;

/** 던지면 작업이 일시정지되고 text가 이유로 보인다 */
class Pause extends LocalError {}

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
      reject(new Error('Tab did not finish loading'));
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
    throw new Pause(msg('msg.tabClosed'));
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

type Outcome = { ok: true; message?: LocalText } | { ok: false; reason: FailReason; message?: LocalText };

async function redeemOne(tabId: number, site: BattlenetSite, code: string): Promise<Outcome> {
  await browser.tabs.update(tabId, { url: keyClaimUrl(site, code) });
  await waitForTabComplete(tabId).catch(() => undefined);

  // 등록은 여러 화면을 거친다: 입력(key-claim) → 오류면 결과(key-lookup), 유효하면 확인(confirm-key-claim)에서 "확인" 클릭.
  // 같은 화면에서 버튼을 두 번 누르지 않도록 누른 화면 주소를 기억한다.
  const clickedOn = new Set<string>();
  const deadline = Date.now() + RESULT_TIMEOUT;
  let last: BnetPageState | undefined;

  while (Date.now() < deadline) {
    const url = await tabUrl(tabId);
    if (isBattlenetLoginPage(url)) throw new Pause(msg('msg.battlenetLogin'));

    // 확인·결과 페이지 주소에는 코드가 들어 있다. 다른 코드의 화면이면 아직 이동 중이므로 읽지 않는다.
    const lookupCode = keyLookupCode(url);
    const ours = !lookupCode || sameCode(lookupCode, code);
    // '이미 보유한 상품' 같은 상품 단위 오류는 결과 페이지가 아닌 다른 결제 페이지에 뜰 수 있어 checkout 전체를 읽는다.
    // 다만 그런 페이지에서는 오류 배너만 믿고, 성공 판단과 버튼 클릭은 등록 흐름 페이지(또는 버튼을 누른 뒤)에서만 한다.
    const inFlow = isKeyFlowPage(url) || clickedOn.size > 0;
    const read: BnetPageState | undefined = ours && isBattlenetCheckout(url) ? await inspect(tabId) : undefined;
    const state = read && (inFlow || read.kind === 'error') ? read : undefined;
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
      ? msg('msg.resultUnconfirmed')
      : last?.kind === 'unknown'
        ? msg('msg.pageUnreadable', { text: last.message })
        : msg('msg.redeemPageMissing'),
  };
}

async function processRedeem(job: Job, key: RewardKey, r: RewardEntry, unknownStreak: { n: number }) {
  if (!r.code) {
    await patchReward(key, () => ({ redeem: { status: 'failed', reason: 'unknown', message: msg('msg.noExtractedCode'), at: Date.now() } }));
    return;
  }
  await patchReward(key, () => ({ redeem: { status: 'running' } }));
  let out: Outcome;
  try {
    // 예전 버전이 남긴 작업에는 상점 정보가 없다. 그때는 한국 상점만 지원했다.
    out = await redeemOne(job.tabId, job.site ?? { region: 'kr', locale: 'ko' }, r.code);
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
    throw new Pause(msg('msg.tooManyUnknown', { count: MAX_CONSECUTIVE_UNKNOWN }));
  }
}

async function processExtract(job: Job, key: RewardKey, r: RewardEntry) {
  let res;
  try {
    res = await sendToTab(job.tabId, { type: 'source/extract', reward: r });
  } catch {
    throw new Pause(msg('msg.sourceDisconnected'));
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
          await patchJob(() => ({ status: 'paused', pauseReason: e.text, current: undefined }));
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
    await patchJob(() => ({ status: 'paused', pauseReason: errorText(e), current: undefined }));
  } finally {
    looping = false;
  }
}

export async function startJob(kind: Job['kind'], tabId: number, keys: RewardKey[]) {
  const cur = await jobItem.getValue();
  if (cur && (cur.status === 'running' || (cur.status === 'paused' && looping))) {
    throw new LocalError(msg('msg.jobAlreadyRunning'));
  }
  let site: BattlenetSite | undefined;
  if (kind === 'redeem') {
    // 등록은 작업을 시작한 탭의 상점(지역·언어)에서 한다. 결과를 화면 문구로 읽으므로 문구를 아는 언어만 받는다.
    site = battlenetSite(await tabUrl(tabId).catch(() => undefined));
    if (!site || !pageLanguageOf(site)) throw new LocalError(msg('msg.unsupportedBattlenetPage'));
  }
  await jobItem.setValue({ kind, status: 'running', tabId, queue: keys, index: 0, startedAt: Date.now(), site });
  void runLoop();
}

/** 서비스 워커가 다시 켜졌을 때 '진행 중'으로 남은 작업을 일시정지로 바꾼다 */
export async function recoverJob() {
  const j = await jobItem.getValue();
  if (j?.status === 'running' && !looping) {
    await patchJob(() => ({ status: 'paused', pauseReason: msg('msg.jobInterrupted'), current: undefined }));
  }
}
