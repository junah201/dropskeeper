import { handleMessages, isJobMessage } from '@/lib/messages';
import { recoverJob, runLoop, startJob } from '@/lib/jobs';
import { jobItem, patchJob, patchReward } from '@/lib/storage';

export default defineBackground(() => {
  void recoverJob();

  handleMessages(isJobMessage, async (msg) => {
    switch (msg.type) {
      case 'job/start':
        await startJob(msg.kind, msg.tabId, msg.keys);
        return { ok: true };
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
    }
  });
});
