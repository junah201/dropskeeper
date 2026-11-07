import { useMemo, useState } from 'react';
import { sendToBackground, sendToTab } from '@/lib/messages';
import { sourceMetas } from '@/lib/sources/hosts';
import { lastLoadedItem, mergeRewards } from '@/lib/storage';
import { BATTLENET_KEY_CLAIM_URL } from '@/lib/redeem/battlenet/constants';
import type { Job, RewardEntry, RewardKey, SourceId } from '@/lib/types';
import { isDefined, rewardKey } from '@/lib/types';
import { fmtDateTime, fmtPeriod, isExpired } from '@/lib/expiry';
import { useStored } from '../hooks';
import { Bar, Btn, Check, Notice, SelectAllBar, Shell, StatGrid, Tag, Thumb } from '../ui';

interface Props {
  sourceId: SourceId;
  tabId: number;
  rewards: Record<RewardKey, RewardEntry>;
  job: Job | null;
}

export function SourceView({ sourceId, tabId, rewards, job }: Props) {
  const meta = sourceMetas[sourceId];
  // 유효기간이 지난 보상은 추출해도 쓸 수 없으니 목록에서 아예 뺀다
  const mine = useMemo(() => Object.values(rewards).filter((r) => r.sourceId === sourceId && !isExpired(r)), [rewards, sourceId]);

  if (job?.kind === 'extract' && (job.status === 'running' || job.status === 'paused')) {
    return <Extracting job={job} rewards={rewards} />;
  }
  if (job?.kind === 'extract' && (job.status === 'done' || job.status === 'stopped')) {
    return <ExtractDone job={job} rewards={rewards} />;
  }
  return <RewardList sourceId={sourceId} tabId={tabId} list={mine} jobBusy={job?.status === 'running'} />;
}

async function loadRewards(sourceId: SourceId, tabId: number): Promise<string | null> {
  let res;
  try {
    res = await sendToTab(tabId, { type: 'source/list' });
  } catch {
    return '페이지와 연결하지 못했어요. 인벤토리 페이지를 새로고침한 뒤 다시 시도하세요.';
  }
  if (!res?.ok) return res?.error ?? '목록을 불러오지 못했어요.';
  await mergeRewards(sourceId, res.rewards);
  return null;
}

function RewardList({ sourceId, tabId, list, jobBusy }: { sourceId: SourceId; tabId: number; list: RewardEntry[]; jobBusy: boolean }) {
  const meta = sourceMetas[sourceId];
  const lastLoaded = useStored(lastLoadedItem)?.[sourceId];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<RewardKey>>(new Set());
  const [hideExtracted, setHideExtracted] = useState(false);
  // 획득 완료된 보상은 대개 이미 등록한 코드라 기본으로 숨긴다
  const [hideClaimed, setHideClaimed] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    setError(await loadRewards(sourceId, tabId));
    setLoading(false);
  };

  const visible = useMemo(
    () =>
      list
        .filter((r) => !(hideExtracted && r.code) && !(hideClaimed && isClaimedElsewhere(r)))
        .sort(
          (a, b) =>
            Number(!!a.code) - Number(!!b.code) ||
            Number(isClaimedElsewhere(a)) - Number(isClaimedElsewhere(b)) ||
            (b.acquiredAt ?? '').localeCompare(a.acquiredAt ?? ''),
        ),
    [list, hideExtracted, hideClaimed],
  );
  const selectable = visible.filter((r) => !r.code);
  const unclaimed = selectable.filter((r) => !r.claimed);
  const selectUnclaimed = () => setSelected(new Set(unclaimed.map(rewardKey)));
  const chosen = selectable.filter((r) => selected.has(rewardKey(r)));
  const all = selectable.length > 0 && chosen.length === selectable.length;

  const toggle = (k: RewardKey) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const toggleAll = () => setSelected(all ? new Set() : new Set(selectable.map(rewardKey)));

  const extract = async () => {
    const res = await sendToBackground({ type: 'job/start', kind: 'extract', tabId, keys: chosen.map(rewardKey) });
    if (!res.ok) setError(res.error);
    else setSelected(new Set());
  };

  // B1: 아직 불러온 적 없음
  if (list.length === 0) {
    return (
      <Shell step="collect">
        <div className="flex h-full flex-col px-4 pb-4 pt-6">
          <h2 className="text-[17px] font-bold leading-snug">
            {meta.name} 드롭스 인벤토리에서
            <br />
            오버워치 보상을 가져옵니다
          </h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-sub">
            로그인된 계정으로 보상 목록을 불러와요. 코드는 다음 단계에서 고른 보상만 추출합니다.
          </p>
          {error && (
            <div className="mt-4">
              <Notice tone="bad">{error}</Notice>
            </div>
          )}
          <div className="mt-auto">
            <Btn full onClick={load} disabled={loading}>
              {loading ? '불러오는 중…' : '보상 목록 불러오기'}
            </Btn>
            <p className="mt-2 text-center text-[11px] text-faint">유효기간이 남은 오버워치 코드형 보상만 가져와요</p>
          </div>
        </div>
      </Shell>
    );
  }

  // B2: 보상 목록 / 선택
  return (
    <Shell
      step="collect"
      footer={
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-sub">
            <b className="text-ink">{chosen.length}개</b> 선택
          </span>
          <div className="flex-1">
            <Btn full disabled={chosen.length === 0 || jobBusy} onClick={extract}>
              키 추출 ({chosen.length})
            </Btn>
          </div>
        </div>
      }
    >
      {/* 내용이 짧아도 화면 높이를 채워, 빈 목록 문구는 가운데·마지막 불러오기는 맨 아래에 둔다 */}
      <div className="flex min-h-full flex-col">
        <SelectAllBar all={all} some={chosen.length > 0} onToggle={toggleAll}>
          · {visible.length}개 표시 / 전체 {list.length}개
        </SelectAllBar>
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
          <FilterChip on={hideClaimed} onClick={() => setHideClaimed((v) => !v)}>
            획득 완료 숨김
          </FilterChip>
          {!hideClaimed && unclaimed.length > 0 && (
            <button type="button" className="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10.5px] font-semibold text-sub" onClick={selectUnclaimed}>
              미획득만 선택 ({unclaimed.length})
            </button>
          )}
          <FilterChip on={hideExtracted} onClick={() => setHideExtracted((v) => !v)}>
            추출됨 숨김
          </FilterChip>
          <button className="ml-auto text-[11.5px] font-semibold text-accent disabled:text-faint" onClick={load} disabled={loading}>
            {loading ? '불러오는 중…' : '다시 불러오기'}
          </button>
        </div>
        {error && (
          <div className="px-3 pb-2">
            <Notice tone="bad">{error}</Notice>
          </div>
        )}
        {visible.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-3 text-center text-[12.5px] text-faint">조건에 맞는 보상이 없어요.</p>
        ) : (
          <ul className="border-y border-line bg-panel">
            {visible.map((r, i) => {
              const k = rewardKey(r);
              return (
                <li key={k} className={`flex items-center gap-2 px-3 py-1.5 ${i ? 'border-t border-line' : ''} ${r.redeem.status === 'success' ? 'opacity-55' : ''}`}>
                  {r.code ? <span className="w-4 shrink-0" /> : <Check on={selected.has(k)} onChange={() => toggle(k)} label={r.name} />}
                  <Thumb src={r.imageUrl} size="lg" />
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => !r.code && toggle(k)}>
                    <div className="truncate text-[12.5px] font-semibold">{r.name}</div>
                    {/* 기간이 잘리지 않도록 캠페인 이름보다 앞에 둔다 */}
                    <div className="truncate text-[11px] text-faint">
                      <span className="font-mono tabular-nums">{fmtPeriod(r.acquiredAt, r.expiresAt)}</span>
                      {r.campaign ? ` · ${r.campaign}` : ''}
                    </div>
                  </button>
                  <RewardTag r={r} />
                </li>
              );
            })}
          </ul>
        )}
        {lastLoaded && <p className="mt-auto px-3 py-3 text-[11px] text-faint">마지막 불러오기 <span className="font-mono tabular-nums">{fmtDateTime(lastLoaded)}</span></p>}
      </div>
    </Shell>
  );
}

/** 플랫폼에서는 획득 완료인데 dropkeeper에는 코드가 없는 보상 (다른 곳에서 받아 간 것) */
const isClaimedElsewhere = (r: RewardEntry) => !!r.claimed && !r.code;

function RewardTag({ r }: { r: RewardEntry }) {
  if (r.redeem.status === 'success') return <Tag tone="ok">등록됨</Tag>;
  if (r.code) return <Tag tone="accent">추출됨</Tag>;
  if (r.extractError) return <Tag tone="bad">추출 실패</Tag>;
  if (r.claimed) return <Tag tone="warn">획득 완료</Tag>;
  return <Tag tone="mute">미추출</Tag>;
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${on ? 'bg-accent-soft text-accent' : 'bg-[#eef0f3] text-sub'}`}
    >
      {children}
    </button>
  );
}

// B3: 키 추출 중
function Extracting({ job, rewards }: { job: Job; rewards: Record<RewardKey, RewardEntry> }) {
  const paused = job.status === 'paused';
  const doneKeys = job.queue.slice(0, job.index);
  const current = job.current ? rewards[job.current] : undefined;
  return (
    <Shell
      step="collect"
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
      <div className="px-4 pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-bold">{paused ? '키 추출 일시정지' : '키 추출 중'}</h2>
          <span className="font-mono text-[13px] tabular-nums">
            {job.index} / {job.queue.length}
          </span>
        </div>
        <div className="mt-3">
          <Bar value={job.index} total={job.queue.length} />
        </div>
        {current && <p className="mt-2 truncate text-[12px] text-sub">지금: {current.name}</p>}
        {paused && job.pauseReason && (
          <div className="mt-3">
            <Notice tone="warn">{job.pauseReason}</Notice>
          </div>
        )}
      </div>
      <ul className="mx-4 mt-5 overflow-hidden rounded-md border border-line bg-panel text-[12px]">
        {doneKeys
          .slice(-6)
          .reverse()
          .map((k, i) => {
            const r = rewards[k];
            if (!r) return null;
            return (
              <li key={k} className={`flex items-center justify-between gap-2 px-3 py-2 ${i ? 'border-t border-line' : ''}`}>
                <span className="truncate">{r.name}</span>
                {r.code ? (
                  <span className="shrink-0 font-mono text-ok">{r.code.slice(0, 4)}-…</span>
                ) : (
                  <span className="shrink-0 text-bad">실패</span>
                )}
              </li>
            );
          })}
        {doneKeys.length === 0 && <li className="px-3 py-2 text-faint">첫 코드를 요청하는 중…</li>}
      </ul>
      <p className="px-4 pt-3 text-[11px] text-faint">팝업을 닫아도 계속 진행돼요</p>
    </Shell>
  );
}

// B4: 추출 완료
function ExtractDone({ job, rewards }: { job: Job; rewards: Record<RewardKey, RewardEntry> }) {
  const items = job.queue.slice(0, job.index).map((k) => rewards[k]).filter(isDefined);
  const ok = items.filter((r) => r.code);
  const fail = items.filter((r) => !r.code);
  const retry = (keys: RewardKey[]) => sendToBackground({ type: 'job/start', kind: 'extract', tabId: job.tabId, keys });

  return (
    <Shell
      step="collect"
      footer={
        <div className="grid gap-2">
          <Btn full onClick={() => browser.tabs.create({ url: BATTLENET_KEY_CLAIM_URL })}>
            Battle.net 등록 페이지 열기
          </Btn>
          <Btn kind="ghost" full onClick={() => sendToBackground({ type: 'job/clear' })}>
            목록으로 돌아가기
          </Btn>
        </div>
      }
    >
      <div className="px-4 pb-4 pt-6">
        <h2 className="text-[15px] font-bold">
          {job.status === 'stopped' ? '추출을 중지했어요' : `키 ${ok.length}개를 추출했어요`}
        </h2>
        <p className="mt-1 text-[12.5px] text-sub">Battle.net 코드 등록 페이지에서 확장을 다시 열면 이어서 등록할 수 있어요.</p>
        <div className="mt-4">
          <StatGrid
            items={[
              ['추출 성공', <span className="font-mono text-[18px] text-ok">{ok.length}</span>],
              ['실패', <span className="font-mono text-[18px] text-bad">{fail.length}</span>],
            ]}
          />
        </div>
        {fail.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {fail.map((r) => (
              <li key={rewardKey(r)} className="flex items-start justify-between gap-2 rounded-md border border-line bg-panel px-3 py-2.5 text-[12px]">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.name}</div>
                  <div className="text-bad">{r.extractError ?? '알 수 없는 오류'}</div>
                </div>
                <Btn kind="ghost" size="sm" onClick={() => retry([rewardKey(r)])}>
                  재시도
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
