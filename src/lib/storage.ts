import type { Job, RewardEntry, RewardKey, SourceId, SourceReward } from './types';
import { rewardKey } from './types';
import { isExpired } from './expiry';

export const rewardsItem = storage.defineItem<Record<RewardKey, RewardEntry>>('local:rewards', {
  fallback: {},
});

export const jobItem = storage.defineItem<Job | null>('local:job', { fallback: null });

/** 플랫폼별 마지막 불러오기 시각 */
export const lastLoadedItem = storage.defineItem<Partial<Record<SourceId, number>>>('local:lastLoaded', {
  fallback: {},
});

// 여러 곳에서 동시에 고쳐도 덮어쓰지 않도록 쓰기를 한 줄로 세운다.
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

/** 새로 불러온 목록을 합친다. 이미 꺼낸 코드와 등록 결과는 유지한다. */
export function mergeRewards(sourceId: SourceId, list: SourceReward[]) {
  return serial(async () => {
    const all = await rewardsItem.getValue();
    const now = Date.now();
    // 기한이 지난 보상은 저장해 둘 이유가 없다. 등록에 성공한 기록만 남긴다.
    for (const [key, r] of Object.entries(all) as [RewardKey, RewardEntry][]) {
      if (r.sourceId === sourceId && isExpired(r, now) && r.redeem.status !== 'success') delete all[key];
    }
    for (const r of list.filter((x) => !isExpired(x, now))) {
      const key = rewardKey(r);
      const prev = all[key];
      all[key] = prev
        ? { ...prev, ...r, campaign: r.campaign ?? prev.campaign, updatedAt: now }
        : { ...r, redeem: { status: 'idle' }, updatedAt: now };
    }
    await rewardsItem.setValue(all);
    await lastLoadedItem.setValue({ ...(await lastLoadedItem.getValue()), [sourceId]: now });
  });
}

export function patchReward(key: RewardKey, patch: (r: RewardEntry) => Partial<RewardEntry>) {
  return serial(async () => {
    const all = await rewardsItem.getValue();
    const r = all[key];
    if (!r) return;
    all[key] = { ...r, ...patch(r), updatedAt: Date.now() };
    await rewardsItem.setValue(all);
  });
}

export function patchJob(patch: (j: Job) => Partial<Job> | null) {
  return serial(async () => {
    const j = await jobItem.getValue();
    if (!j) return null;
    const p = patch(j);
    const next = p === null ? null : { ...j, ...p };
    await jobItem.setValue(next);
    return next;
  });
}
