import { handleMessages, isBackgroundMessage, sendToTab, type Result } from '@/lib/messages';
import { msg as localText } from '@/lib/i18n';
import { recoverJob, runLoop, startJob } from '@/lib/jobs';
import { extractCandidates, pendingRewards } from '@/lib/pending';
import { rewardKey, type SourceId } from '@/lib/types';
import { dismissRewards, jobItem, mergeRewards, patchJob, patchReward, patchSettings, rewardsItem } from '@/lib/storage';

export default defineBackground(() => {
  void recoverJob();

  // 툴바 아이콘에 등록 대기 코드 수를 띄워, 추출한 뒤 확장 아이콘을 다시 눌러야 한다는 걸 알린다
  void browser.action.setBadgeBackgroundColor({ color: '#2350d8' });
  void updateBadge();
  rewardsItem.watch(() => void updateBadge());

  handleMessages(isBackgroundMessage, async (msg, sender): Promise<Result> => {
    switch (msg.type) {
      case 'rewards/load':
        return loadRewards(msg.sourceId, msg.tabId);
      case 'rewards/loadHere': {
        const tabId = sender.tab?.id;
        if (tabId == null) return { ok: false, error: localText('msg.pageDisconnected') };
        return loadRewards(msg.sourceId, tabId);
      }
      case 'rewards/dismiss':
        await dismissRewards(msg.keys);
        return { ok: true };
      case 'job/start': {
        const all = await rewardsItem.getValue();
        await startJob(msg.kind, msg.tabId, msg.keys.filter((k) => !all[k]?.dismissed));
        return { ok: true };
      }
      case 'job/redeemPending': {
        const tabId = sender.tab?.id;
        if (tabId == null) return { ok: false, error: localText('msg.pageDisconnected') };
        const keys = pendingRewards(await rewardsItem.getValue()).map(rewardKey);
        if (keys.length === 0) return { ok: false, error: localText('msg.noPendingCodes') };
        await startJob('redeem', tabId, keys);
        return { ok: true };
      }
      case 'job/extractPending': {
        const tabId = sender.tab?.id;
        if (tabId == null) return { ok: false, error: localText('msg.pageDisconnected') };
        const keys = extractCandidates(await rewardsItem.getValue(), msg.sourceId).map(rewardKey);
        if (keys.length === 0) return { ok: false, error: localText('msg.noExtractableCodes') };
        await startJob('extract', tabId, keys);
        return { ok: true };
      }
      case 'job/pause':
        await patchJob(() => ({ status: 'paused', pauseReason: undefined }));
        return { ok: true };
      case 'job/resume':
        await patchJob(() => ({ status: 'running', pauseReason: undefined }));
        void runLoop();
        return { ok: true };
      case 'job/stop': {
        const j = await patchJob(() => ({ status: 'stopped', current: undefined, nextAt: undefined }));
        // 등록 중이던 항목이 '진행 중'으로 남지 않게 되돌린다
        if (j?.kind === 'redeem') {
          for (const k of j.queue) await patchReward(k, (r) => (r.redeem.status === 'running' ? { redeem: { status: 'idle' } } : {}));
        }
        return { ok: true };
      }
      case 'job/clear':
        await jobItem.setValue(null);
        return { ok: true };
      case 'ui/openPopup':
        // Chrome 127부터 쓸 수 있다. 창에 포커스가 없거나 브라우저가 지원하지 않으면 실패한다.
        try {
          await browser.action.openPopup(sender.tab?.windowId != null ? { windowId: sender.tab.windowId } : undefined);
          return { ok: true };
        } catch {
          return { ok: false, error: localText('msg.popupOpenFailed') };
        }
      case 'settings/set':
        await patchSettings(msg.patch);
        return { ok: true };
    }
  });
});

async function updateBadge() {
  const n = pendingRewards(await rewardsItem.getValue()).length;
  await browser.action.setBadgeText({ text: n === 0 ? '' : n > 99 ? '99+' : String(n) });
}

/** 목록만 플랫폼 탭에서 받고 합치기는 여기서 한다. 쓰기를 background에 모아야 등록 작업과 겹쳐도 덮어쓰지 않는다. */
async function loadRewards(sourceId: SourceId, tabId: number): Promise<Result> {
  let res;
  try {
    res = await sendToTab(tabId, { type: 'source/list' });
  } catch {
    return { ok: false, error: localText('msg.pageDisconnected') };
  }
  if (!res?.ok) return { ok: false, error: res?.error ?? localText('msg.listFailed'), kind: res?.kind };
  await mergeRewards(sourceId, res.rewards);
  return { ok: true };
}
