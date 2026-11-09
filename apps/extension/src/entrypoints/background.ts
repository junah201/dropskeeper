import { handleMessages, isBackgroundMessage, sendToTab, type Result } from '@/lib/messages';
import { msg as localText } from '@/lib/i18n';
import { recoverJob, runLoop, startJob } from '@/lib/jobs';
import { dismissRewards, jobItem, mergeRewards, patchJob, patchReward, patchSettings, rewardsItem } from '@/lib/storage';

export default defineBackground(() => {
  void recoverJob();

  handleMessages(isBackgroundMessage, async (msg): Promise<Result> => {
    switch (msg.type) {
      case 'rewards/load': {
        // 목록은 플랫폼 탭에서 받아 오고, 저장소 합치기는 여기(background)에서 한다.
        // 저장소 쓰기를 background 한 곳에 모아야 등록 작업과 동시에 실행돼도 서로 덮어쓰지 않는다.
        let res;
        try {
          res = await sendToTab(msg.tabId, { type: 'source/list' });
        } catch {
          return { ok: false, error: localText('msg.pageDisconnected') };
        }
        if (!res?.ok) return { ok: false, error: res?.error ?? localText('msg.listFailed'), kind: res?.kind };
        await mergeRewards(msg.sourceId, res.rewards);
        return { ok: true };
      }
      case 'rewards/dismiss':
        await dismissRewards(msg.keys);
        return { ok: true };
      case 'job/start': {
        const all = await rewardsItem.getValue();
        await startJob(msg.kind, msg.tabId, msg.keys.filter((k) => !all[k]?.dismissed));
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
      case 'settings/set':
        await patchSettings(msg.patch);
        return { ok: true };
    }
  });
});
