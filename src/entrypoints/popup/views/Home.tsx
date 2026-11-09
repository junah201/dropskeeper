import { sourceMetas } from '@/lib/sources/hosts';
import { BATTLENET_KEY_CLAIM_URL } from '@/lib/redeem/battlenet/constants';
import type { Job, RewardEntry, RewardKey } from '@/lib/types';
import { isExpired } from '@/lib/expiry';
import { Btn, Notice, Shell, StatGrid } from '../ui';

export function Home({ rewards, job }: { rewards: Record<RewardKey, RewardEntry>; job: Job | null }) {
  const list = Object.values(rewards).filter((r) => r.redeem.status === 'success' || !isExpired(r));
  const withCode = list.filter((r) => r.code);
  const ok = list.filter((r) => r.redeem.status === 'success').length;
  const failed = list.filter((r) => r.redeem.status === 'failed').length;
  const open = (url: string) => browser.tabs.create({ url });
  const activeJob = job && (job.status === 'running' || job.status === 'paused') ? job : null;

  return (
    <Shell step={null}>
      <div className="flex h-full flex-col gap-4 px-4 pb-4 pt-5">
        <div>
          <h1 className="text-[16px] font-semibold leading-snug">드롭스 페이지나 Battle.net 등록 페이지에서 열어 주세요</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-sub">
            드롭스 인벤토리에서 코드를 모으고, Battle.net 코드 등록 페이지에서 한 번에 등록합니다.
          </p>
        </div>

        {activeJob && (
          <Notice tone={activeJob.status === 'paused' ? 'warn' : 'accent'}>
            {activeJob.kind === 'extract' ? '코드 추출' : '코드 등록'}이 {activeJob.status === 'paused' ? '일시정지됐어요' : '진행 중이에요'}{' '}
            <span className="font-mono tabular-nums">
              {activeJob.index}/{activeJob.queue.length}
            </span>
            <button className="ml-2 font-medium underline underline-offset-2" onClick={() => browser.tabs.update(activeJob.tabId, { active: true })}>
              작업 탭으로 이동
            </button>
          </Notice>
        )}

        {/* 다음에 할 일을 알려 주는 숫자는 등록 대기 하나라 그것만 포인트 색으로 칠한다 */}
        <StatGrid
          items={[
            { label: '추출한 코드', value: withCode.length },
            { label: '등록 대기', value: withCode.filter((r) => r.redeem.status !== 'success').length, tone: 'accent' },
            { label: '등록 성공', value: ok },
            { label: '등록 실패', value: failed, tone: 'bad' },
          ]}
        />

        <div className="mt-auto grid gap-2">
          {Object.values(sourceMetas).map((m) => (
            <Btn key={m.id} kind="ghost" full onClick={() => open(m.inventoryUrl)}>
              {m.name} 드롭스 인벤토리 열기
            </Btn>
          ))}
          <Btn full onClick={() => open(BATTLENET_KEY_CLAIM_URL)}>
            Battle.net 코드 등록 페이지 열기
          </Btn>
        </div>
      </div>
    </Shell>
  );
}
