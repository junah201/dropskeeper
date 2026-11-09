import type { Job, RewardEntry, RewardKey, Settings, SourceId, SourceReward } from './types';
import { defaultSettings, rewardKey } from './types';
import { isExpired } from './expiry';

export const rewardsItem = storage.defineItem<Record<RewardKey, RewardEntry>>('local:rewards', {
  fallback: {},
});

export const jobItem = storage.defineItem<Job | null>('local:job', { fallback: null });

export const lastLoadedItem = storage.defineItem<Partial<Record<SourceId, number>>>('local:lastLoaded', {
  fallback: {},
});

export const settingsItem = storage.defineItem<Settings>('local:settings', { fallback: defaultSettings });

// 여러 곳에서 동시에 고쳐도 덮어쓰지 않도록 쓰기를 한 줄로 세운다.
// 이 줄은 실행 환경(popup, background)마다 따로 생기므로, 아래 쓰기 함수는 background에서만 호출한다.
// popup은 background에 메시지를 보내 쓰기를 요청한다.
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

/**
 * 새로 불러온 목록을 합친다. 이미 꺼낸 코드와 등록 결과는 유지한다.
 * `list`는 그 플랫폼의 등록 가능한 보상 전체여야 한다 (일부만 넘기면 나머지가 지워진다).
 */
export function mergeRewards(sourceId: SourceId, list: SourceReward[]) {
  return serial(async () => {
    const all = await rewardsItem.getValue();
    const now = Date.now();
    const incoming = new Set(list.map(rewardKey));
    for (const [key, r] of Object.entries(all) as [RewardKey, RewardEntry][]) {
      if (r.sourceId !== sourceId) continue;
      // 기한이 지난 보상은 저장해 둘 이유가 없다. 등록에 성공한 기록만 남긴다.
      if (isExpired(r, now) && r.redeem.status !== 'success') delete all[key];
      // 플랫폼 목록에서 사라진 보상은 더 이상 코드를 꺼낼 수 없으니 지운다.
      // 이미 꺼낸 코드는 등록에 쓸 수 있으므로 남긴다.
      else if (!incoming.has(key) && !r.code) delete all[key];
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

/** 사용자가 고른 보상을 목록에서 삭제한다 (dismissed 표시) */
export function dismissRewards(keys: RewardKey[]) {
  return serial(async () => {
    const all = await rewardsItem.getValue();
    const now = Date.now();
    for (const k of keys) if (all[k]) all[k] = { ...all[k], dismissed: true, updatedAt: now };
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

/** 설정 일부를 바꾼다. 예전 버전에서 저장한 설정에 없는 항목은 기본값으로 채운다. */
export function patchSettings(patch: Partial<Settings>) {
  return serial(async () => {
    await settingsItem.setValue({ ...defaultSettings, ...(await settingsItem.getValue()), ...patch });
  });
}
