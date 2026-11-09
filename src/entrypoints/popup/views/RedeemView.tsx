import { useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '#i18n';
import { sendToBackground } from '@/lib/messages';
import { msg, tx, type LocalText } from '@/lib/i18n';
import { sourceMetas } from '@/lib/sources/hosts';
import { failReasonOf, isRetryable } from '@/lib/labels';
import type { FailReason, Job, RewardEntry, RewardKey } from '@/lib/types';
import { isDefined, rewardKey } from '@/lib/types';
import { isExpired, parseDate } from '@/lib/expiry';
import { useNow } from '../hooks';
import { Bar, Btn, Check, ExpiryLine, CodeChip, Counts, Notice, SelectAllBar, SelectedCount, Shell, Tag, Thumb } from '../ui';

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
    /* 무시: 클립보드 권한이 없을 때 */
  }
}

/** 정렬용 만료 시각. 만료일이 없으면 맨 뒤로 보낸다. */
const expiryOrder = (r: RewardEntry) => parseDate(r.expiresAt) ?? Infinity;

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
        // 실패한 코드는 뒤로, 그 안에서는 만료가 가까운 순(만료일 없는 것은 맨 뒤), 같으면 이름순
        .sort(
          (a, b) =>
            Number(a.redeem.status === 'failed') - Number(b.redeem.status === 'failed') ||
            expiryOrder(a) - expiryOrder(b) ||
            a.name.localeCompare(b.name),
        ),
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
        <div className="border-b border-line px-3 py-2">
          {loginPage ? (
            <Notice tone="warn">{i18n.t('redeem.loginFirst')}</Notice>
          ) : unsupportedPage ? (
            <Notice tone="warn">{tx(msg('msg.unsupportedBattlenetPage'))}</Notice>
          ) : (
            error && <Notice tone="bad">{tx(error)}</Notice>
          )}
        </div>
      )}
      {/* 위 전체 선택 줄이 아래 테두리를 가지므로 목록은 바로 붙이고 아래 테두리만 둔다 */}
      <ul className="border-b border-line bg-panel">
        {list.map((r, i) => {
          const k = rewardKey(r);
          const failed = r.redeem.status === 'failed';
          return (
            // 행 어디를 눌러도 선택된다. 체크박스 클릭도 이 onClick으로 전달된다.
            <li
              key={k}
              onClick={() => toggle(k)}
              className={`flex cursor-pointer select-none items-center gap-3 px-3 py-2 hover:bg-bg ${i ? 'border-t border-line' : ''}`}
            >
              <Check on={selected.has(k)} label={r.name} />
              <Thumb src={r.imageUrl} size="lg" source={r.sourceId} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">{r.name}</div>
                {/* 코드와 만료일을 한 줄에 두어 "무엇을, 언제까지"가 같이 읽히게 한다 */}
                <div className="mt-1 flex items-center gap-2">
                  <CodeChip code={r.code!} />
                  <div className="min-w-0">
                    <ExpiryLine r={r} />
                  </div>
                </div>
                {failed && <div className="mt-1 text-[12px] text-bad">{i18n.t('redeem.lastAttempt', { reason: reasonLabel(failReasonOf(r.redeem.reason)) })}</div>}
              </div>
              <button
                type="button"
                className="shrink-0 text-[12px] font-medium text-accent underline-offset-2 hover:underline"
                onClick={(e) => {
                  e.stopPropagation(); // 복사 버튼은 선택을 바꾸지 않는다
                  void copy(r.code!).then(() => setCopied(k));
                }}
                title={i18n.t('common.copyCode')}
              >
                {copied === k ? i18n.t('common.copied') : i18n.t('common.copy')}
              </button>
              {failed && (
                <button
                  type="button"
                  className="shrink-0 text-[12px] font-medium text-bad underline-offset-2 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    void dismiss([k]);
                  }}
                  title={i18n.t('common.deleteFromList')}
                >
                  {i18n.t('common.delete')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="px-3 py-3 text-[12px] text-faint">{i18n.t('redeem.pacingHint')}</p>
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

  // 진행 중인 행(또는 다음 차례 행)이 보이도록 스크롤한다. 코드 추출 화면과 같은 방식.
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
        <div className="px-4 pt-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">{paused ? i18n.t('redeem.paused') : i18n.t('redeem.running')}</h2>
            <span className="font-mono text-[18px] font-medium tabular-nums">
              {job.index}
              <span className="text-faint"> / {job.queue.length}</span>
            </span>
          </div>
          <div className="mt-3">
            <Bar value={job.index} total={job.queue.length} />
          </div>
          <div className="mt-3">
            <Counts
              items={[
                { label: i18n.t('common.succeeded'), value: ok, dot: 'bg-ok' },
                { label: i18n.t('common.failed'), value: fail, dot: 'bg-bad' },
                { label: i18n.t('redeem.remaining'), value: job.queue.length - job.index, dot: 'bg-check' },
              ]}
            />
          </div>
          {paused && job.pauseReason && (
            <div className="mt-3">
              <Notice tone="warn">{tx(job.pauseReason)}</Notice>
            </div>
          )}
        </div>

        <ul className="mx-3 mt-4 min-h-0 flex-1 overflow-y-auto rounded-[10px] border border-line bg-panel text-[13px]">
          {job.queue.map((k, i) => {
            const r = rewards[k];
            if (!r) return null;
            const isCurrent = k === job.current;
            // 다음 코드를 기다리는 동안에는 다음 차례 행을 표시한다
            const isNext = !job.current && i === job.index && !paused;
            const done = i < job.index;
            return (
              <li
                key={k}
                ref={isCurrent || isNext ? currentRef : undefined}
                className={`flex items-center gap-3 px-3 py-2 ${i ? 'border-t border-line' : ''} ${isCurrent ? 'bg-accent-soft' : ''} ${
                  !done && !isCurrent && !isNext ? 'opacity-50' : ''
                }`}
              >
                <Thumb src={r.imageUrl} source={r.sourceId} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{r.name}</div>
                  {r.code && (
                    <div className="mt-1">
                      <CodeChip code={r.code} size="sm" />
                    </div>
                  )}
                </div>
                <RunStatus r={r} done={done} isCurrent={isCurrent} isNext={isNext} waitSec={waiting ? waitSec : 0} />
              </li>
            );
          })}
        </ul>
        <p className="px-4 py-3 text-[12px] text-faint">
          {waiting ? i18n.t('redeem.nextIn', { seconds: waitSec }) : ''}
          {i18n.t('common.keepsRunning')}
        </p>
      </div>
    </Shell>
  );
}

/** 등록 중 목록 오른쪽의 상태 표시 */
function RunStatus({ r, done, isCurrent, isNext, waitSec }: { r: RewardEntry; done: boolean; isCurrent: boolean; isNext: boolean; waitSec: number }) {
  if (isCurrent) return <span className="shrink-0 font-medium text-accent">{i18n.t('redeem.statusRunning')}</span>;
  if (done) {
    if (r.redeem.status === 'success') return <span className="shrink-0 font-medium text-ok">{i18n.t('common.redeemed')}</span>;
    if (r.redeem.status === 'failed')
      return (
        <span className="shrink-0 font-medium text-bad">
          {reasonLabel(failReasonOf(r.redeem.reason))}
        </span>
      );
    return <span className="shrink-0 text-faint">{i18n.t('redeem.statusSkipped')}</span>;
  }
  if (isNext && waitSec > 0) return <span className="shrink-0 font-mono text-sub tabular-nums">{i18n.t('redeem.statusIn', { seconds: waitSec })}</span>;
  return <span className="shrink-0 text-faint">{i18n.t('common.waiting')}</span>;
}

// C3: 등록 결과 / 재시도
function Results({ job, rewards }: { job: Job; rewards: Record<RewardKey, RewardEntry> }) {
  const items = job.queue.map((k) => rewards[k]).filter(isDefined);
  const fails = items.filter((r) => r.redeem.status === 'failed');
  const oks = items.filter((r) => r.redeem.status === 'success');
  const [tab, setTab] = useState<'fail' | 'ok'>(fails.length ? 'fail' : 'ok');
  const retry = (keys: RewardKey[]) => sendToBackground({ type: 'job/start', kind: 'redeem', tabId: job.tabId, keys });
  // 이미 사용된 코드·이미 보유한 상품은 다시 시도해도 소용없으니 재시도에서 빼고 한 번에 지울 수 있게 한다
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
      <div role="tablist" className="flex border-b border-line px-4 pt-3 text-[14px]">
        {(
          [
            ['fail', i18n.t('common.failed'), fails.length],
            ['ok', i18n.t('common.succeeded'), oks.length],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-3 pb-2 font-medium ${tab === id ? 'border-ink text-ink' : 'border-transparent text-faint'}`}
          >
            {label} <span className="font-mono tabular-nums">{n}</span>
          </button>
        ))}
      </div>

      {tab === 'fail' ? (
        fails.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-faint">{i18n.t('redeem.noFailures')}</p>
        ) : (
          <ul className="grid gap-2 px-4 py-3">
            {fails.map((r) => {
              const reason = failReasonOf(r.redeem.reason);
              return (
                <li key={rewardKey(r)} className="rounded-[10px] border border-line bg-panel p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Thumb src={r.imageUrl} source={r.sourceId} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">{r.name}</div>
                      <div className="mt-1">
                        <CodeChip code={r.code ?? ''} />
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {isRetryable(reason) && (
                        <Btn kind="ghost" size="sm" onClick={() => retry([rewardKey(r)])}>
                          {i18n.t('common.retry')}
                        </Btn>
                      )}
                      <Btn kind="ghost" size="sm" onClick={() => dismiss([rewardKey(r)])}>
                        {i18n.t('common.delete')}
                      </Btn>
                    </div>
                  </div>
                  <div className="mt-2 rounded bg-bad-soft p-2 text-[12px] text-bad">
                    <span className="font-medium">{reasonLabel(reason)}</span> · {reasonHelp(reason)}
                    {/* 이유를 아는 실패는 설명으로 충분하니 원문은 알 수 없는 오류일 때만 보여 준다 */}
                    {reason === 'unknown' && r.redeem.message && (
                      <div className="mt-0.5 break-all font-mono opacity-80">{i18n.t('redeem.rawMessage', { text: tx(r.redeem.message) })}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : oks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-faint">{i18n.t('redeem.noSuccesses')}</p>
      ) : (
        <ul className="border-b border-line bg-panel">
          {oks.map((r, i) => (
            <li key={rewardKey(r)} className={`flex items-center gap-3 px-4 py-2 ${i ? 'border-t border-line' : ''}`}>
              <Thumb src={r.imageUrl} source={r.sourceId} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{r.name}</span>
              <Tag tone="ok">{i18n.t('common.redeemed')}</Tag>
            </li>
          ))}
        </ul>
      )}
      </div>
    </Shell>
  );
}
