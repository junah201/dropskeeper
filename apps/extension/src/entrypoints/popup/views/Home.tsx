import { i18n } from '#i18n';
import { sourceMetas } from '@/lib/sources/hosts';
import { defaultBattlenetSite, keyClaimPageUrl } from '@/lib/redeem/battlenet/constants';
import { uiLang } from '@/lib/i18n';
import type { Job, RewardEntry, RewardKey } from '@/lib/types';
import { isExpired } from '@/lib/expiry';
import { Btn, Notice, Shell, StatGrid } from '../ui';

/** 진행 중인 작업 안내 문구 (작업 종류 × 상태) */
const jobNotice = {
  extract: { running: 'home.extractRunning', paused: 'home.extractPaused' },
  redeem: { running: 'home.redeemRunning', paused: 'home.redeemPaused' },
} as const;

export function Home({ rewards, job }: { rewards: Record<RewardKey, RewardEntry>; job: Job | null }) {
  const list = Object.values(rewards).filter((r) => r.redeem.status === 'success' || !isExpired(r));
  const withCode = list.filter((r) => r.code);
  const ok = list.filter((r) => r.redeem.status === 'success').length;
  const failed = list.filter((r) => r.redeem.status === 'failed').length;
  // 새 탭을 열면 팝업이 닫히므로 지금 탭에서 이동한다. 이동이 끝나면 팝업이 그 페이지 화면으로 바뀐다.
  const open = (url: string) => browser.tabs.update({ url });
  const activeJob = job && (job.status === 'running' || job.status === 'paused') ? job : null;

  return (
    <Shell step={null}>
      <div className="flex h-full flex-col gap-4 px-4 pb-4 pt-5">
        <div>
          <h1 className="text-[16px] font-semibold leading-snug">{i18n.t('home.title')}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-sub">{i18n.t('home.description')}</p>
        </div>

        {activeJob && (
          <Notice tone={activeJob.status === 'paused' ? 'warn' : 'accent'}>
            {i18n.t(jobNotice[activeJob.kind][activeJob.status === 'paused' ? 'paused' : 'running'])}{' '}
            <span className="font-mono tabular-nums">
              {activeJob.index}/{activeJob.queue.length}
            </span>
            <button className="ml-2 font-medium underline underline-offset-2" onClick={() => browser.tabs.update(activeJob.tabId, { active: true })}>
              {i18n.t('home.goToJobTab')}
            </button>
          </Notice>
        )}

        {/* 다음에 할 일을 알려 주는 숫자는 등록 대기 하나라 그것만 포인트 색으로 칠한다 */}
        <StatGrid
          items={[
            { label: i18n.t('home.statExtracted'), value: withCode.length },
            { label: i18n.t('home.statPending'), value: withCode.filter((r) => r.redeem.status !== 'success').length, tone: 'accent' },
            { label: i18n.t('home.statRedeemed'), value: ok },
            { label: i18n.t('home.statFailed'), value: failed, tone: 'bad' },
          ]}
        />

        <div className="mt-auto grid gap-2">
          {Object.values(sourceMetas).map((m) => (
            <Btn key={m.id} kind="ghost" full onClick={() => open(m.inventoryUrl)}>
              {i18n.t('common.openInventory', { name: m.name })}
            </Btn>
          ))}
          <Btn full onClick={() => open(keyClaimPageUrl(defaultBattlenetSite(uiLang())))}>
            {i18n.t('common.openRedeemPage')}
          </Btn>
        </div>
      </div>
    </Shell>
  );
}
