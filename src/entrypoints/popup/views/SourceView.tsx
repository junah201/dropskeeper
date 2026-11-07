import { useEffect, useMemo, useRef, useState } from 'react';
import { sendToBackground } from '@/lib/messages';
import { sourceMetas } from '@/lib/sources/hosts';
import { lastLoadedItem } from '@/lib/storage';
import { BATTLENET_KEY_CLAIM_URL } from '@/lib/redeem/battlenet/constants';
import type { Job, RewardEntry, RewardKey, SourceId } from '@/lib/types';
import { isDefined, rewardKey } from '@/lib/types';
import { fmtDate, fmtDateTime, fmtExpiry, isExpired } from '@/lib/expiry';
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

/** 불러오기와 저장은 background가 맡는다. 실패하면 보여 줄 문구를 돌려준다. */
async function loadRewards(sourceId: SourceId, tabId: number): Promise<string | null> {
  try {
    const res = await sendToBackground({ type: 'rewards/load', sourceId, tabId });
    return res.ok ? null : res.error;
  } catch {
    return '확장 프로그램과 연결하지 못했어요. 팝업을 다시 열어 주세요.';
  }
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
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
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
            <p className="mt-2 text-center text-[12px] text-faint">유효기간이 남은 오버워치 코드형 보상만 가져와요</p>
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
          <span className="text-[13px] text-sub">
            <b className="text-ink">{chosen.length}개</b> 선택
          </span>
          <div className="flex-1">
            <Btn full disabled={chosen.length === 0 || jobBusy} onClick={extract}>
              코드 추출 ({chosen.length})
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
          {meta.tracksClaimed && (
            <FilterChip on={hideClaimed} onClick={() => setHideClaimed((v) => !v)}>
              획득 완료 숨김
            </FilterChip>
          )}
          {meta.tracksClaimed && !hideClaimed && unclaimed.length > 0 && (
            <button
              type="button"
              className="inline-flex h-6 items-center rounded-md border border-line bg-panel px-2 text-[12.5px] font-semibold text-ink hover:bg-bg"
              onClick={selectUnclaimed}
            >
              미획득만 선택 ({unclaimed.length})
            </button>
          )}
          <FilterChip on={hideExtracted} onClick={() => setHideExtracted((v) => !v)}>
            추출됨 숨김
          </FilterChip>
          <button className="ml-auto text-[12.5px] font-semibold text-accent disabled:text-faint" onClick={load} disabled={loading}>
            {loading ? '불러오는 중…' : '다시 불러오기'}
          </button>
        </div>
        {error && (
          <div className="px-3 pb-2">
            <Notice tone="bad">{error}</Notice>
          </div>
        )}
        {visible.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-3 text-center text-[13.5px] text-faint">조건에 맞는 보상이 없어요.</p>
        ) : (
          <ul className="border-y border-line bg-panel">
            {visible.map((r, i) => {
              const k = rewardKey(r);
              return (
                // 행 어디를 눌러도 선택된다. 체크박스 클릭도 이 onClick으로 전달된다.
                <li
                  key={k}
                  onClick={r.code ? undefined : () => toggle(k)}
                  className={`flex items-center gap-2 px-3 py-1.5 ${i ? 'border-t border-line' : ''} ${r.redeem.status === 'success' ? 'opacity-55' : ''} ${
                    r.code ? '' : 'cursor-pointer select-none hover:bg-bg'
                  }`}
                >
                  {r.code ? <span className="w-4 shrink-0" /> : <Check on={selected.has(k)} label={r.name} />}
                  <Thumb src={r.imageUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{r.name}</div>
                    {/* 만료일이 잘리지 않도록 캠페인 이름보다 앞에 둔다 */}
                    <ExpiryLine r={r} />
                  </div>
                  <RewardTag r={r} />
                </li>
              );
            })}
          </ul>
        )}
        {lastLoaded && <p className="mt-auto px-3 py-3 text-[12px] text-faint">마지막 불러오기 <span className="font-mono tabular-nums">{fmtDateTime(lastLoaded)}</span></p>}
      </div>
    </Shell>
  );
}

/** 만료일 · 캠페인. 만료가 가까우면 D-n을 주황색으로 강조한다. */
function ExpiryLine({ r }: { r: RewardEntry }) {
  const exp = fmtExpiry(r.expiresAt);
  return (
    <div className="truncate text-[12px] text-faint">
      {exp.text && (
        <span
          className={`font-mono tabular-nums ${exp.soon ? 'font-semibold text-warn' : ''}`}
          title={exp.soon ? `${fmtDate(r.expiresAt)} 만료` : undefined}
        >
          {exp.text}
        </span>
      )}
      {exp.text && r.campaign ? ' · ' : ''}
      {r.campaign}
    </div>
  );
}

/** 플랫폼에서는 획득 완료인데 dropkeeper에는 코드가 없는 보상 (다른 곳에서 받아 간 것) */
const isClaimedElsewhere = (r: RewardEntry) => !!r.claimed && !r.code;

function RewardTag({ r }: { r: RewardEntry }) {
  if (r.redeem.status === 'success') return <Tag tone="ok">등록됨</Tag>;
  if (r.code) return <Tag tone="mute">추출됨</Tag>;
  if (r.extractError) return <Tag tone="bad">추출 실패</Tag>;
  if (r.claimed) return <Tag tone="warn">획득 완료</Tag>;
  return <Tag tone="accent">미추출</Tag>;
}

/**
 * 켜고 끄는 필터. 상태 태그(Tag)와 구분되도록 테두리·체크 표시·24px 높이를 가진 버튼 모양으로 그린다.
 */
function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[12.5px] font-semibold transition-colors ${
        on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel text-sub hover:border-check hover:text-ink'
      }`}
    >
      <span className={`grid h-3 w-3 place-items-center rounded-[3px] ${on ? 'bg-accent' : 'border border-check'}`} aria-hidden>
        {on && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

// B3: 코드 추출 중
function Extracting({ job, rewards }: { job: Job; rewards: Record<RewardKey, RewardEntry> }) {
  const paused = job.status === 'paused';
  const current = job.current ? rewards[job.current] : undefined;
  // 진행 중인 항목이 목록 밖에 있으면 보이도록 스크롤한다
  const currentRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [job.index, job.current]);
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
      {/* 진행 요약은 위에 고정하고, 나머지 높이는 전체 목록이 채운다 */}
      <div className="flex h-full flex-col">
        <div className="px-4 pt-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">{paused ? '코드 추출 일시정지' : '코드 추출 중'}</h2>
            <span className="font-mono text-[14px] tabular-nums">
              {job.index} / {job.queue.length}
            </span>
          </div>
          <div className="mt-3">
            <Bar value={job.index} total={job.queue.length} />
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
            const isCurrent = k === job.current || (!current && i === job.index && !paused);
            const done = i < job.index;
            return (
              <li
                key={k}
                ref={isCurrent ? currentRef : undefined}
                className={`flex items-center gap-2.5 px-3 py-1.5 ${i ? 'border-t border-line' : ''} ${isCurrent ? 'bg-accent-soft' : ''} ${
                  !done && !isCurrent ? 'opacity-50' : ''
                }`}
              >
                <Thumb src={r.imageUrl} />
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                {done ? (
                  r.code ? (
                    <span className="shrink-0 font-mono text-ok">{r.code.slice(0, 4)}-…</span>
                  ) : (
                    <span className="shrink-0 font-semibold text-bad" title={r.extractError}>
                      실패
                    </span>
                  )
                ) : isCurrent ? (
                  <span className="shrink-0 font-semibold text-accent">요청 중…</span>
                ) : (
                  <span className="shrink-0 text-faint">대기</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="px-4 py-3 text-[12px] text-faint">팝업을 닫아도 계속 진행돼요</p>
      </div>
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
          {job.status === 'stopped' ? '추출을 중지했어요' : `코드 ${ok.length}개를 추출했어요`}
        </h2>
        <p className="mt-1 text-[13.5px] text-sub">Battle.net 코드 등록 페이지에서 확장을 다시 열면 이어서 등록할 수 있어요.</p>
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
              <li key={rewardKey(r)} className="flex items-start justify-between gap-2 rounded-md border border-line bg-panel px-3 py-2.5 text-[13px]">
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
