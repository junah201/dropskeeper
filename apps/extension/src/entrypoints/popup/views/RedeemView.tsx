import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { i18n } from '#i18n';
import { sendToBackground } from '@/lib/messages';
import { msg, tx, type LocalText } from '@/lib/i18n';
import { sourceMetas } from '@/lib/sources/hosts';
import { failReasonOf, isRetryable } from '@/lib/labels';
import type { FailReason, Job, RewardEntry, RewardKey } from '@/lib/types';
import { isDefined, rewardKey } from '@/lib/types';
import { isExpired } from '@/lib/expiry';
import { redeemOrder } from '@/lib/pending';
import { useNow } from '../hooks';
import { DoneRow, FailCard, FootNote, ProgressHeader, ProgressList, ProgressRow, QueueRow, ResultTabs, StatusText, TextBtn } from '@dropskeeper/popup-ui';
import { Btn, ExpiryLine, CodeChip, Counts, Notice, SelectAllBar, SelectedCount, Shell, Tag, sourceBadge } from '../ui';

interface Props {
  tabId: number;
  loginPage: boolean;
  /** 결과 문구를 모르는 언어의 상점이거나 등록 페이지가 아니다 */
  unsupportedPage: boolean;
  rewards: Record<RewardKey, RewardEntry>;
  job: Job | null;
}

export function RedeemView({ tabId, loginPage, unsupportedPage, rewards, job }: Props) {
  if (job?.kind === 'redeem' && (job.status === 'running' || job.status === 'paused')) {
    return <Running job={job} rewards={rewards} />;
  }
  if (job?.kind === 'redeem' && (job.status === 'done' || job.status === 'stopped')) {
    return <Results job={job} rewards={rewards} />;
  }
  return <Queue tabId={tabId} loginPage={loginPage} unsupportedPage={unsupportedPage} rewards={rewards} jobBusy={job?.status === 'running'} />;
}

const reasonLabel = (reason: FailReason) => i18n.t(`reason.${reason}.label` as const);
const reasonHelp = (reason: FailReason) => i18n.t(`reason.${reason}.help` as const);

/** 목록에서 삭제한다. 다시 불러와도 되살아나지 않는다. */
const dismiss = (keys: RewardKey[]) => sendToBackground({ type: 'rewards/dismiss', keys });

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 클립보드 권한이 없으면 복사만 건너뛴다
  }
}

// C1: 등록 대기 목록
function Queue({
  tabId,
  loginPage,
  unsupportedPage,
  rewards,
  jobBusy,
}: {
  tabId: number;
  loginPage: boolean;
  unsupportedPage: boolean;
  rewards: Record<RewardKey, RewardEntry>;
  jobBusy: boolean;
}) {
  const list = useMemo(
    () =>
      Object.values(rewards)
        .filter((r) => r.code && r.redeem.status !== 'success' && !isExpired(r))
        .sort(redeemOrder),
    [rewards],
  );
  const [selected, setSelected] = useState<Set<RewardKey>>(() => new Set(list.filter((r) => r.redeem.status !== 'failed').map(rewardKey)));
  const [error, setError] = useState<LocalText | null>(null);
  const [copied, setCopied] = useState<RewardKey | null>(null);

  const chosen = list.filter((r) => selected.has(rewardKey(r)));
  const all = list.length > 0 && chosen.length === list.length;
  const toggle = (k: RewardKey) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const start = async () => {
    setError(null);
    const res = await sendToBackground({ type: 'job/start', kind: 'redeem', tabId, keys: chosen.map(rewardKey) });
    if (!res.ok) setError(res.error);
  };

  if (list.length === 0) {
    return (
      <Shell step="redeem">
        <div className="flex h-full flex-col px-4 pb-4 pt-6">
          <h2 className="text-[16px] font-semibold">{i18n.t('redeem.emptyTitle')}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-sub">{i18n.t('redeem.emptyDescription')}</p>
          <div className="mt-auto grid gap-2">
            {Object.values(sourceMetas).map((m) => (
              <Btn key={m.id} kind="ghost" full onClick={() => browser.tabs.create({ url: m.inventoryUrl })}>
                {i18n.t('common.openInventory', { name: m.name })}
              </Btn>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      step="redeem"
      footer={
        <div className="flex items-center gap-3">
          <SelectedCount count={chosen.length} />
          <div className="flex flex-1 gap-2">
            <Btn kind="ghost" disabled={chosen.length === 0 || jobBusy} onClick={() => dismiss(chosen.map(rewardKey))} title={i18n.t('redeem.deleteSelected')}>
              {i18n.t('common.delete')}
            </Btn>
            <div className="flex-1">
              <Btn full disabled={chosen.length === 0 || loginPage || unsupportedPage || jobBusy} onClick={start}>
                {i18n.t('redeem.start', { count: chosen.length })}
              </Btn>
            </div>
          </div>
        </div>
      }
    >
      <SelectAllBar all={all} some={chosen.length > 0} onToggle={() => setSelected(all ? new Set() : new Set(list.map(rewardKey)))}>
        {i18n.t('redeem.pendingCount', { count: list.length })}
      </SelectAllBar>
      {(loginPage || unsupportedPage || error) && (
        <div className="border-b border-line px-4 py-2">
          {loginPage ? (
            <Notice tone="warn">{i18n.t('redeem.loginFirst')}</Notice>
          ) : unsupportedPage ? (
            <Notice tone="warn">{tx(msg('msg.unsupportedBattlenetPage'))}</Notice>
          ) : (
            error && <Notice tone="bad">{tx(error)}</Notice>
          )}
        </div>
      )}
      {/* 전체 선택 줄에 아래 테두리가 있어 목록은 바로 붙이고 아래 테두리만 둔다 */}
      <ul className="border-b border-line bg-panel">
        {list.map((r, i) => {
          const k = rewardKey(r);
          const failed = r.redeem.status === 'failed';
          return (
            <QueueRow
              key={k}
              first={i === 0}
              checked={selected.has(k)}
              onClick={() => toggle(k)}
              thumb={r.imageUrl}
              badge={sourceBadge(r.sourceId)}
              name={r.name}
              code={<CodeChip code={r.code!} />}
              meta={<ExpiryLine r={r} />}
              failedText={failed ? i18n.t('redeem.lastAttempt', { reason: reasonLabel(failReasonOf(r.redeem.reason)) }) : undefined}
              actions={
                <>
                  <TextBtn
                    onClick={(e) => {
                      e.stopPropagation(); // 복사 버튼은 선택을 바꾸지 않는다
                      void copy(r.code!).then(() => setCopied(k));
                    }}
                    title={i18n.t('common.copyCode')}
                  >
                    {copied === k ? i18n.t('common.copied') : i18n.t('common.copy')}
                  </TextBtn>
                  {failed && (
                    <TextBtn
                      tone="bad"
                      onClick={(e) => {
                        e.stopPropagation();
                        void dismiss([k]);
                      }}
                      title={i18n.t('common.deleteFromList')}
                    >
                      {i18n.t('common.delete')}
                    </TextBtn>
                  )}
                </>
              }
            />
          );
        })}
      </ul>
      <p className="px-4 py-3 text-[12px] text-faint">{i18n.t('redeem.pacingHint')}</p>
    </Shell>
  );
}

// C2: 등록 진행 중
function Running({ job, rewards }: { job: Job; rewards: Record<RewardKey, RewardEntry> }) {
  const paused = job.status === 'paused';
  const now = useNow(!paused);
  const done = job.queue.slice(0, job.index).map((k) => rewards[k]).filter(isDefined);
  const ok = done.filter((r) => r.redeem.status === 'success').length;
  const fail = done.filter((r) => r.redeem.status === 'failed').length;
  const current = job.current ? rewards[job.current] : undefined;
  const waitSec = job.nextAt ? Math.max(0, Math.ceil((job.nextAt - now) / 1000)) : 0;
  const waiting = !paused && !current && waitSec > 0;

  // 진행 중인 행(또는 다음 차례 행)이 보이도록 스크롤한다
  const currentRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [job.index, job.current]);

  return (
    <Shell
      step="redeem"
      footer={
        <div className="grid grid-cols-2 gap-2">
          {paused ? (
            <Btn onClick={() => sendToBackground({ type: 'job/resume' })}>{i18n.t('common.resume')}</Btn>
          ) : (
            <Btn kind="ghost" onClick={() => sendToBackground({ type: 'job/pause' })}>
              {i18n.t('common.pause')}
            </Btn>
          )}
          <Btn kind="danger" onClick={() => sendToBackground({ type: 'job/stop' })}>
            {i18n.t('common.stop')}
          </Btn>
        </div>
      }
    >
      {/* 진행 요약은 위에 고정하고, 나머지 높이는 전체 대기열 목록이 채운다 */}
      <div className="flex h-full flex-col">
        <ProgressHeader title={paused ? i18n.t('redeem.paused') : i18n.t('redeem.running')} index={job.index} total={job.queue.length}>
          <div className="mt-3">
            <Counts
              items={[
                { label: i18n.t('common.succeeded'), value: ok, tone: 'ok' },
                { label: i18n.t('common.failed'), value: fail, tone: 'bad' },
                { label: i18n.t('redeem.remaining'), value: job.queue.length - job.index, tone: 'mute' },
              ]}
            />
          </div>
          {paused && job.pauseReason && (
            <div className="mt-3">
              <Notice tone="warn">{tx(job.pauseReason)}</Notice>
            </div>
          )}
        </ProgressHeader>

        <ProgressList>
          {job.queue.map((k, i) => {
            const r = rewards[k];
            if (!r) return null;
            const isCurrent = k === job.current;
            // 다음 코드를 기다리는 동안에는 다음 차례 행을 표시한다
            const isNext = !job.current && i === job.index && !paused;
            const done = i < job.index;
            return (
              <ProgressRow
                key={k}
                ref={isCurrent || isNext ? currentRef : undefined}
                first={i === 0}
                current={isCurrent}
                dim={!done && !isCurrent && !isNext}
                thumb={r.imageUrl}
                badge={sourceBadge(r.sourceId)}
                name={r.name}
                twoLine
                code={r.code && <CodeChip code={r.code} size="sm" />}
                status={<RunStatus r={r} done={done} isCurrent={isCurrent} isNext={isNext} waitSec={waiting ? waitSec : 0} />}
              />
            );
          })}
        </ProgressList>
        <FootNote>
          {waiting ? i18n.t('redeem.nextIn', { seconds: waitSec }) : ''}
          {i18n.t('common.keepsRunning')}
        </FootNote>
      </div>
    </Shell>
  );
}

/** 등록 중 목록 오른쪽의 상태 표시 */
function RunStatus({ r, done, isCurrent, isNext, waitSec }: { r: RewardEntry; done: boolean; isCurrent: boolean; isNext: boolean; waitSec: number }) {
  if (isCurrent) return <StatusText tone="accent">{i18n.t('redeem.statusRunning')}</StatusText>;
  if (done) {
    if (r.redeem.status === 'success') return <StatusText tone="ok">{i18n.t('common.redeemed')}</StatusText>;
    if (r.redeem.status === 'failed') return <StatusText tone="bad">{reasonLabel(failReasonOf(r.redeem.reason))}</StatusText>;
    return <StatusText tone="faint">{i18n.t('redeem.statusSkipped')}</StatusText>;
  }
  if (isNext && waitSec > 0) return <StatusText tone="timer">{i18n.t('redeem.statusIn', { seconds: waitSec })}</StatusText>;
  return <StatusText tone="faint">{i18n.t('common.waiting')}</StatusText>;
}

// C3: 등록 결과 / 재시도
function Results({ job, rewards }: { job: Job; rewards: Record<RewardKey, RewardEntry> }) {
  const items = job.queue.map((k) => rewards[k]).filter(isDefined);
  const fails = items.filter((r) => r.redeem.status === 'failed');
  const oks = items.filter((r) => r.redeem.status === 'success');
  const [tab, setTab] = useState<'fail' | 'ok'>(fails.length ? 'fail' : 'ok');
  const retry = (keys: RewardKey[]) => sendToBackground({ type: 'job/start', kind: 'redeem', tabId: job.tabId, keys });
  // 이미 사용된 코드·이미 보유한 상품은 다시 해도 같으니 재시도에서 빼고 한 번에 지우게 한다
  const retryable = fails.filter((r) => isRetryable(failReasonOf(r.redeem.reason)));
  const hopeless = fails.filter((r) => !isRetryable(failReasonOf(r.redeem.reason)));

  return (
    <Shell
      step="redeem"
      footer={
        <div className="grid gap-2">
          {retryable.length > 0 && (
            <Btn full onClick={() => retry(retryable.map(rewardKey))}>
              {i18n.t('redeem.retryFailed', { count: retryable.length })}
            </Btn>
          )}
          {hopeless.length > 0 && (
            <Btn kind={retryable.length > 0 ? 'ghost' : undefined} full onClick={() => dismiss(hopeless.map(rewardKey))}>
              {i18n.t('redeem.deleteHopeless', { count: hopeless.length })}
            </Btn>
          )}
          <Btn kind="ghost" full onClick={() => sendToBackground({ type: 'job/clear' })}>
            {i18n.t('redeem.backToQueue')}
          </Btn>
        </div>
      }
    >
      {/* 내용이 짧아도 화면 높이를 채워, 빈 목록 문구가 가운데에 오게 한다 */}
      <div className="flex min-h-full flex-col">
      {job.status === 'stopped' && (
        <div className="px-4 pt-3">
          <Notice tone="mute">{i18n.t('redeem.stoppedNotice', job.queue.length - job.index)}</Notice>
        </div>
      )}
      <ResultTabs
        tabs={[
          { id: 'fail', label: i18n.t('common.failed'), count: fails.length },
          { id: 'ok', label: i18n.t('common.succeeded'), count: oks.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'fail' ? (
        fails.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-faint">{i18n.t('redeem.noFailures')}</p>
        ) : (
          <ul className="grid gap-2 px-4 py-3">
            {fails.map((r) => {
              const reason = failReasonOf(r.redeem.reason);
              return (
                <FailCard
                  key={rewardKey(r)}
                  thumb={r.imageUrl}
                  badge={sourceBadge(r.sourceId)}
                  name={r.name}
                  code={<CodeChip code={r.code ?? ''} />}
                  actions={
                    <>
                      {isRetryable(reason) && (
                        <Btn kind="ghost" size="sm" onClick={() => retry([rewardKey(r)])}>
                          {i18n.t('common.retry')}
                        </Btn>
                      )}
                      <Btn kind="ghost" size="sm" onClick={() => dismiss([rewardKey(r)])}>
                        {i18n.t('common.delete')}
                      </Btn>
                    </>
                  }
                >
                  <span className="font-medium">{reasonLabel(reason)}</span> · {reasonHelp(reason)}
                  {/* 이유를 아는 실패는 설명으로 충분하니 원문은 unknown일 때만 보여 준다 */}
                  {reason === 'unknown' && r.redeem.message && (
                    <div className="mt-0.5 break-all font-mono opacity-80">{i18n.t('redeem.rawMessage', { text: tx(r.redeem.message) })}</div>
                  )}
                </FailCard>
              );
            })}
          </ul>
        )
      ) : oks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-faint">{i18n.t('redeem.noSuccesses')}</p>
      ) : (
        <ul className="border-b border-line bg-panel">
          {oks.map((r, i) => (
            <DoneRow
              key={rewardKey(r)}
              first={i === 0}
              thumb={r.imageUrl}
              badge={sourceBadge(r.sourceId)}
              name={r.name}
              tag={<Tag tone="ok">{i18n.t('common.redeemed')}</Tag>}
            />
          ))}
        </ul>
      )}
      </div>
    </Shell>
  );
}
