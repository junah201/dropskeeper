/**
 * 드롭스 인벤토리 페이지의 안내 카드.
 *
 * 인벤토리를 열면 보상 목록을 자동으로 불러와 추출할 코드를 세고, 있으면 "지금 추출하기"를 띄운다.
 * 추출은 플랫폼에 "획득 완료"로 남아 되돌릴 수 없으므로 자동으로 하지 않고 사용자가 눌러야 시작한다.
 * 추출이 끝나면 Battle.net 등록 페이지로 이어 준다.
 *
 * 저장소는 읽기만 하고, 불러오기·추출 시작은 background에 요청한다.
 */
import type { ContentScriptContext } from '#imports';
import { i18n } from '#i18n';
import { sendToBackground } from '../messages';
import { tx, uiLang } from '../i18n';
import { PageCard, type CardState } from '../pageCard';
import { extractCandidates } from '../pending';
import { jobItem, lastLoadedItem, needsAutoLoad, rewardsItem, settingsItem } from '../storage';
import { defaultSettings, isDefined, type Job, type RewardEntry, type RewardKey, type SourceId } from '../types';
import { defaultBattlenetSite, keyClaimPageUrl } from '../redeem/battlenet/constants';
import { sourceMetas } from './hosts';

export function watchInventory(sourceId: SourceId, ctx: ContentScriptContext) {
  const meta = sourceMetas[sourceId];
  const card = new PageCard();
  // 이 시각 뒤에 시작한 추출만 "끝났어요" 카드로 보여 준다. 예전 작업 결과가 새로 연 페이지에 뜨지 않게 한다.
  const pageStart = Date.now();
  let onInventory = false;
  let enabled = false;
  /** 목록을 믿고 쓸 수 있는지. 방금 불러왔거나 최근에 불러온 적이 있을 때만 추출할 코드를 센다. */
  let ready = false;

  const isOurJob = (j: Job | null): j is Job => j?.kind === 'extract' && j.queue.some((k) => k.startsWith(`${sourceId}:`));

  const render = async () => {
    if (!onInventory || !enabled) return card.show(null);
    const [rewards, job] = await Promise.all([rewardsItem.getValue(), jobItem.getValue()]);
    if (isOurJob(job)) {
      const state = jobState(job, rewards, pageStart);
      if (state !== undefined) return card.show(state);
    }
    const n = ready ? extractCandidates(rewards, sourceId).length : 0;
    card.show(n === 0 ? null : foundState(sourceId, n));
  };

  const check = async () => {
    const settings = { ...defaultSettings, ...(await settingsItem.getValue()) };
    enabled = settings.pageHints;
    if (!onInventory || !enabled) return render();
    const [last, job] = await Promise.all([lastLoadedItem.getValue().then((l) => l[sourceId]), jobItem.getValue()]);
    // 이 탭에서 추출하는 중이면 목록을 다시 부르지 않는다
    if (!needsAutoLoad(last) || (isOurJob(job) && job.status === 'running')) {
      ready = true;
    } else {
      // 로그인하지 않았거나 실패하면 조용히 넘어간다(카드를 띄우지 않는다)
      const res = await sendToBackground({ type: 'rewards/loadHere', sourceId }).catch(() => undefined);
      ready = !!res?.ok;
    }
    await render();
  };

  const onLocation = () => {
    const now = meta.inventoryPattern.test(location.href);
    if (now === onInventory) return;
    onInventory = now;
    // 다른 페이지로 갔다가 돌아오면 닫았던 카드도 다시 보여 준다
    card.reset();
    void check();
  };

  onLocation();
  // 두 플랫폼 모두 페이지 이동을 history로 처리하므로 주소 변화를 따로 지켜본다
  ctx.addEventListener(window, 'wxt:locationchange', onLocation);
  const unwatch = [
    rewardsItem.watch(() => void render()),
    jobItem.watch(() => void render()),
    settingsItem.watch(() => void check()),
    // 팝업에서 목록을 불러오면 그 뒤로는 카드를 띄워도 된다
    lastLoadedItem.watch((l) => {
      if (l[sourceId] != null && !ready) {
        ready = true;
        void render();
      }
    }),
  ];
  ctx.onInvalidated(() => {
    unwatch.forEach((u) => u());
    card.show(null);
  });
}

function foundState(sourceId: SourceId, n: number): CardState {
  return {
    title: i18n.t('card.extractFound', n),
    description: i18n.t('card.extractFoundDescription', { name: sourceMetas[sourceId].name }),
    action: {
      label: i18n.t('card.extractStart'),
      busyLabel: i18n.t('card.starting'),
      run: async () => {
        const res = await sendToBackground({ type: 'job/extractPending', sourceId });
        return res.ok ? undefined : tx(res.error);
      },
    },
  };
}

/** 추출 작업 상태에 맞는 카드. undefined면 작업과 상관없이 추출할 코드 카드를 보여 준다. */
function jobState(job: Job, rewards: Record<RewardKey, RewardEntry>, pageStart: number): CardState | undefined {
  const total = job.queue.length;
  if (job.status === 'running') {
    return {
      title: i18n.t('card.extracting', { done: job.index, total }),
      description: i18n.t('card.extractingDescription'),
      progress: total ? job.index / total : 0,
    };
  }
  if (job.status === 'paused') {
    return {
      title: i18n.t('extracting.paused'),
      description: job.pauseReason ? tx(job.pauseReason) : undefined,
      progress: total ? job.index / total : 0,
      action: {
        label: i18n.t('common.resume'),
        run: async () => {
          const res = await sendToBackground({ type: 'job/resume' });
          return res.ok ? undefined : tx(res.error);
        },
      },
    };
  }
  if (job.startedAt < pageStart) return undefined;

  const items = job.queue.slice(0, job.index).map((k) => rewards[k]).filter(isDefined);
  const ok = items.filter((r) => r.code).length;
  const fail = items.length - ok;
  if (ok === 0) {
    return { title: i18n.t('card.extractNone'), description: i18n.t('card.extractNoneDescription') };
  }
  const failNote = fail > 0 ? ` ${i18n.t('card.extractSomeFailed', { count: fail })}` : '';
  return {
    title: i18n.t('extractDone.done', ok),
    description: i18n.t('card.extractDoneDescription') + failNote,
    action: {
      label: i18n.t('extractDone.goRedeem'),
      run: () => {
        window.open(keyClaimPageUrl(defaultBattlenetSite(uiLang())), '_blank', 'noopener');
      },
    },
  };
}
