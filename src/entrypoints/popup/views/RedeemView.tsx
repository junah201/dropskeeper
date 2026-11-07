import { useEffect, useMemo, useRef, useState } from 'react';
import { sendToBackground } from '@/lib/messages';
import { sourceMetas } from '@/lib/sources/hosts';
import { failReasonOf, isRetryable, reasonHelp, reasonLabel } from '@/lib/labels';
import type { Job, RewardEntry, RewardKey } from '@/lib/types';
import { isDefined, rewardKey } from '@/lib/types';
import { isExpired } from '@/lib/expiry';
import { useNow } from '../hooks';
import { Bar, Btn, Check, Notice, SelectAllBar, Shell, Tag, Thumb, mask } from '../ui';

interface Props {
  tabId: number;
  loginPage: boolean;
  rewards: Record<RewardKey, RewardEntry>;
  job: Job | null;
}

export function RedeemView({ tabId, loginPage, rewards, job }: Props) {
  if (job?.kind === 'redeem' && (job.status === 'running' || job.status === 'paused')) {
    return <Running job={job} rewards={rewards} />;
  }
  if (job?.kind === 'redeem' && (job.status === 'done' || job.status === 'stopped')) {
    return <Results job={job} rewards={rewards} />;
  }
  return <Queue tabId={tabId} loginPage={loginPage} rewards={rewards} jobBusy={job?.status === 'running'} />;
}

/** 목록에서 삭제한다. 다시 불러와도 되살아나지 않는다. */
const dismiss = (keys: RewardKey[]) => sendToBackground({ type: 'rewards/dismiss', keys });

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* 무시: 클립보드 권한이 없을 때 */
  }
}

// C1: 등록 대기 목록
function Queue({ tabId, loginPage, rewards, jobBusy }: { tabId: number; loginPage: boolean; rewards: Record<RewardKey, RewardEntry>; jobBusy: boolean }) {
  const list = useMemo(
    () =>
      Object.values(rewards)
        .filter((r) => r.code && r.redeem.status !== 'success' && !isExpired(r))
        .sort((a, b) => Number(a.redeem.status === 'failed') - Number(b.redeem.status === 'failed') || a.name.localeCompare(b.name)),
    [rewards],
  );
  const [selected, setSelected] = useState<Set<RewardKey>>(() => new Set(list.filter((r) => r.redeem.status !== 'failed').map(rewardKey)));
  const [error, setError] = useState<string | null>(null);
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
          <h2 className="text-[16px] font-bold">등록할 코드가 없어요</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-sub">드롭스 인벤토리에서 보상을 불러오고 코드를 추출하면 여기에 표시돼요.</p>
          <div className="mt-auto grid gap-2">
            {Object.values(sourceMetas).map((m) => (
              <Btn key={m.id} kind="ghost" full onClick={() => browser.tabs.create({ url: m.inventoryUrl })}>
                {m.name} 드롭스 인벤토리 열기
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
          <span className="text-[13px] text-sub">
            <b className="text-ink">{chosen.length}개</b> 선택
          </span>
          <div className="flex flex-1 gap-2">
            <Btn kind="ghost" disabled={chosen.length === 0 || jobBusy} onClick={() => dismiss(chosen.map(rewardKey))} title="선택한 코드를 목록에서 삭제">
              삭제
            </Btn>
            <div className="flex-1">
              <Btn full disabled={chosen.length === 0 || loginPage || jobBusy} onClick={start}>
                등록하기 ({chosen.length})
              </Btn>
            </div>
          </div>
        </div>
      }
    >
      <SelectAllBar all={all} some={chosen.length > 0} onToggle={() => setSelected(all ? new Set() : new Set(list.map(rewardKey)))}>
        · 등록 대기 {list.length}개
      </SelectAllBar>
      {(loginPage || error) && (
        <div className="border-b border-line px-3 py-2">
          <Notice tone={loginPage ? 'warn' : 'bad'}>{loginPage ? 'Battle.net에 먼저 로그인해 주세요.' : error}</Notice>
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
              className={`flex cursor-pointer select-none items-center gap-2.5 px-3 py-2.5 hover:bg-bg ${i ? 'border-t border-line' : ''}`}
            >
              <Check on={selected.has(k)} label={r.name} />
              <Thumb src={r.imageUrl} size="lg" source={r.sourceId} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{r.name}</div>
                <div className="font-mono text-[12.5px] tabular-nums text-sub">{mask(r.code!)}</div>
                {failed && <div className="mt-0.5 text-[12px] text-bad">지난 시도: {reasonLabel[failReasonOf(r.redeem.reason)]}</div>}
              </div>
              <button
                type="button"
                className="shrink-0 text-[12px] font-semibold text-accent"
                onClick={(e) => {
                  e.stopPropagation(); // 복사 버튼은 선택을 바꾸지 않는다
                  void copy(r.code!).then(() => setCopied(k));
                }}
                title="코드 복사"
              >
                {copied === k ? '복사됨' : '복사'}
              </button>
              {failed && (
                <button
                  type="button"
                  className="shrink-0 text-[12px] font-semibold text-bad"
                  onClick={(e) => {
                    e.stopPropagation();
                    void dismiss([k]);
                  }}
                  title="목록에서 삭제"
                >
                  삭제
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="px-3 py-3 text-[12px] text-faint">코드 사이 0.5~1초 간격 · 이 탭에서 하나씩 등록해요</p>
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
            <Btn onClick={() => sendToBackground({ type: 'job/resume' })}>재개</Btn>
          ) : (
            <Btn kind="ghost" onClick={() => sendToBackground({ type: 'job/pause' })}>
              일시정지
            </Btn>
          )}
          <Btn kind="danger" onClick={() => sendToBackground({ type: 'job/stop' })}>
            중지
          </Btn>
        </div>
      }
    >
      {/* 진행 요약은 위에 고정하고, 나머지 높이는 전체 대기열 목록이 채운다 */}
      <div className="flex h-full flex-col">
        <div className="px-4 pt-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">{paused ? '등록 일시정지' : '등록 중'}</h2>
            <span className="font-mono text-[14px] tabular-nums">
              {job.index} / {job.queue.length}
            </span>
          </div>
          <div className="mt-3">
            <Bar value={job.index} total={job.queue.length} />
          </div>
          <div className="mt-3 flex gap-1.5">
            <Tag tone="ok">성공 {ok}</Tag>
            <Tag tone="bad">실패 {fail}</Tag>
            <Tag tone="mute">남음 {job.queue.length - job.index}</Tag>
          </div>
          {paused && job.pauseReason && (
            <div className="mt-3">
              <Notice tone="warn">{job.pauseReason}</Notice>
            </div>
          )}
        </div>

        <ul className="mx-3 mt-4 min-h-0 flex-1 overflow-y-auto rounded-md border border-line bg-panel text-[13px]">
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
                className={`flex items-center gap-2.5 px-3 py-1.5 ${i ? 'border-t border-line' : ''} ${isCurrent ? 'bg-accent-soft' : ''} ${
                  !done && !isCurrent && !isNext ? 'opacity-50' : ''
                }`}
              >
                <Thumb src={r.imageUrl} source={r.sourceId} />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{r.name}</div>
                  {r.code && <div className="font-mono text-[12px] text-faint">{mask(r.code)}</div>}
                </div>
                <RunStatus r={r} done={done} isCurrent={isCurrent} isNext={isNext} waitSec={waiting ? waitSec : 0} />
              </li>
            );
          })}
        </ul>
        <p className="px-4 py-3 text-[12px] text-faint">
          {waiting ? `다음 코드까지 ${waitSec}초 · ` : ''}팝업을 닫아도 계속 진행돼요
        </p>
      </div>
    </Shell>
  );
}

/** 등록 중 목록 오른쪽의 상태 표시 */
function RunStatus({ r, done, isCurrent, isNext, waitSec }: { r: RewardEntry; done: boolean; isCurrent: boolean; isNext: boolean; waitSec: number }) {
  if (isCurrent) return <span className="shrink-0 font-semibold text-accent">등록 중…</span>;
  if (done) {
    if (r.redeem.status === 'success') return <span className="shrink-0 font-semibold text-ok">등록됨</span>;
    if (r.redeem.status === 'failed')
      return (
        <span className="shrink-0 font-semibold text-bad">
          {reasonLabel[failReasonOf(r.redeem.reason)]}
        </span>
      );
    return <span className="shrink-0 text-faint">건너뜀</span>;
  }
  if (isNext && waitSec > 0) return <span className="shrink-0 font-mono text-sub tabular-nums">{waitSec}초 후</span>;
  return <span className="shrink-0 text-faint">대기</span>;
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
              실패한 {retryable.length}개 다시 시도
            </Btn>
          )}
          {hopeless.length > 0 && (
            <Btn kind={retryable.length > 0 ? 'ghost' : undefined} full onClick={() => dismiss(hopeless.map(rewardKey))}>
              다시 시도할 수 없는 {hopeless.length}개 삭제
            </Btn>
          )}
          <Btn kind="ghost" full onClick={() => sendToBackground({ type: 'job/clear' })}>
            대기 목록으로
          </Btn>
        </div>
      }
    >
      {/* 내용이 짧아도 화면 높이를 채워, 빈 목록 문구가 가운데에 오게 한다 */}
      <div className="flex min-h-full flex-col">
      {job.status === 'stopped' && (
        <div className="px-4 pt-3">
          <Notice tone="mute">
            등록을 중지했어요. {job.queue.length - job.index}개는 시도하지 않았어요.
          </Notice>
        </div>
      )}
      <div role="tablist" className="flex border-b border-line px-4 pt-3 text-[13.5px]">
        {(
          [
            ['fail', '실패', fails.length],
            ['ok', '성공', oks.length],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-3 pb-2 font-semibold ${tab === id ? 'border-ink text-ink' : 'border-transparent text-faint'}`}
          >
            {label} <span className="font-mono">{n}</span>
          </button>
        ))}
      </div>

      {tab === 'fail' ? (
        fails.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-[13.5px] text-faint">실패한 코드가 없어요.</p>
        ) : (
          <ul className="grid gap-2 px-4 py-3">
            {fails.map((r) => {
              const reason = failReasonOf(r.redeem.reason);
              return (
                <li key={rewardKey(r)} className="rounded-md border border-line bg-panel px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Thumb src={r.imageUrl} source={r.sourceId} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold">{r.name}</div>
                      <div className="font-mono text-[12.5px] text-sub">{mask(r.code ?? '')}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {isRetryable(reason) && (
                        <Btn kind="ghost" size="sm" onClick={() => retry([rewardKey(r)])}>
                          다시 시도
                        </Btn>
                      )}
                      <Btn kind="ghost" size="sm" onClick={() => dismiss([rewardKey(r)])}>
                        삭제
                      </Btn>
                    </div>
                  </div>
                  <div className="mt-2 rounded bg-bad-soft px-2 py-1.5 text-[12.5px] text-bad">
                    <b>{reasonLabel[reason]}</b> · {reasonHelp[reason]}
                    {/* 이유를 아는 실패는 설명으로 충분하니 원문은 알 수 없는 오류일 때만 보여 준다 */}
                    {reason === 'unknown' && r.redeem.message && (
                      <div className="mt-0.5 break-all font-mono opacity-80">원문: {r.redeem.message}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : oks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-[13.5px] text-faint">성공한 코드가 없어요.</p>
      ) : (
        <ul className="border-b border-line bg-panel">
          {oks.map((r, i) => (
            <li key={rewardKey(r)} className={`flex items-center gap-2.5 px-4 py-2.5 ${i ? 'border-t border-line' : ''}`}>
              <Thumb src={r.imageUrl} source={r.sourceId} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{r.name}</span>
              <Tag tone="ok">등록됨</Tag>
            </li>
          ))}
        </ul>
      )}
      </div>
    </Shell>
  );
}
