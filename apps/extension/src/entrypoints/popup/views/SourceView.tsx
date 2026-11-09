import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { LoaderCircle } from 'lucide-preact';
import { i18n } from '#i18n';
import { sendToBackground } from '@/lib/messages';
import { msg, tx, type LocalText } from '@/lib/i18n';
import { sourceMetas } from '@/lib/sources/hosts';
import { lastLoadedItem } from '@/lib/storage';
import { defaultBattlenetSite, keyClaimPageUrl } from '@/lib/redeem/battlenet/constants';
import { uiLang } from '@/lib/i18n';
import type { Job, RewardEntry, RewardKey, SourceId } from '@/lib/types';
import { isDefined, rewardKey } from '@/lib/types';
import { fmtDateTime, isExpired } from '@/lib/expiry';
import { useStored } from '../hooks';
import { BusyLabel, ChipBtn, FailCard, FilterChip, FootNote, Hint, IntroBody, ProgressHeader, ProgressList, ProgressRow, QuietTag, RewardRow, StatusText, TextBtn } from '@dropskeeper/popup-ui';
import { Btn, CodeChip, Notice, ExpiryLine, Rich, SelectAllBar, SelectedCount, Shell, StatGrid, Tag } from '../ui';

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
async function loadRewards(sourceId: SourceId, tabId: number): Promise<LocalText | null> {
  try {
    const res = await sendToBackground({ type: 'rewards/load', sourceId, tabId });
    return res.ok ? null : res.error;
  } catch {
    return msg('msg.popupDisconnected');
  }
}

function RewardList({ sourceId, tabId, list, jobBusy }: { sourceId: SourceId; tabId: number; list: RewardEntry[]; jobBusy: boolean }) {
  const meta = sourceMetas[sourceId];
  const lastLoaded = useStored(lastLoadedItem)?.[sourceId];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LocalText | null>(null);
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
        <IntroBody
          title={i18n.t('source.introTitle', { name: meta.name })}
          description={i18n.t('source.introDescription')}
          notice={error && <Notice tone="bad">{tx(error)}</Notice>}
        >
          <Btn full onClick={load} disabled={loading} aria-busy={loading}>
            {loading ? (
              <BusyLabel icon={<LoaderCircle size={16} strokeWidth={2} className="animate-spin motion-reduce:animate-none" aria-hidden />}>
                {i18n.t('source.loading')}
              </BusyLabel>
            ) : (
              i18n.t('source.load')
            )}
          </Btn>
          <Hint>{i18n.t('source.loadHint')}</Hint>
        </IntroBody>
      </Shell>
    );
  }

  // B2: 보상 목록 / 선택
  return (
    <Shell
      step="collect"
      footer={
        <div className="flex items-center gap-3">
          <SelectedCount count={chosen.length} />
          <div className="flex-1">
            <Btn full disabled={chosen.length === 0 || jobBusy} onClick={extract}>
              {i18n.t('source.extract', { count: chosen.length })}
            </Btn>
          </div>
        </div>
      }
    >
      {/* 내용이 짧아도 화면 높이를 채운다. 빈 목록 문구는 가운데, 마지막 불러오기 시각은 맨 아래에 온다 */}
      <div className="flex min-h-full flex-col">
        <SelectAllBar
          all={all}
          some={chosen.length > 0}
          onToggle={toggleAll}
          action={
            <TextBtn onClick={load} disabled={loading}>
              {loading ? i18n.t('source.loadingShort') : i18n.t('source.reload')}
            </TextBtn>
          }
        >
          {i18n.t('source.shownOfTotal', { shown: visible.length, total: list.length })}
        </SelectAllBar>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          {meta.tracksClaimed && (
            <FilterChip on={hideClaimed} onClick={() => setHideClaimed((v) => !v)}>
              {i18n.t('source.hideClaimed')}
            </FilterChip>
          )}
          {meta.tracksClaimed && !hideClaimed && unclaimed.length > 0 && (
            <ChipBtn onClick={selectUnclaimed}>{i18n.t('source.selectUnclaimed', { count: unclaimed.length })}</ChipBtn>
          )}
          <FilterChip on={hideExtracted} onClick={() => setHideExtracted((v) => !v)}>
            {i18n.t('source.hideExtracted')}
          </FilterChip>
        </div>
        {error && (
          <div className="px-4 pb-2">
            <Notice tone="bad">{tx(error)}</Notice>
          </div>
        )}
        {visible.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-faint">{i18n.t('source.noMatch')}</p>
        ) : (
          <ul className="border-y border-line bg-panel">
            {visible.map((r, i) => {
              const k = rewardKey(r);
              return (
                <RewardRow
                  key={k}
                  first={i === 0}
                  selectable={!r.code}
                  checked={selected.has(k)}
                  dim={r.redeem.status === 'success'}
                  onClick={() => toggle(k)}
                  thumb={r.imageUrl}
                  name={r.name}
                  meta={<ExpiryLine r={r} />}
                  tag={<RewardTag r={r} />}
                />
              );
            })}
          </ul>
        )}
        {lastLoaded && <p className="mt-auto px-4 py-3 text-[12px] text-faint"><Rich text={i18n.t('source.lastLoaded', { time: '{time}' })} values={{ time: <span className="font-mono tabular-nums">{fmtDateTime(lastLoaded)}</span> }} /></p>}
      </div>
    </Shell>
  );
}

/** 플랫폼에서는 획득 완료인데 DropsKeeper에는 코드가 없는 보상 (다른 곳에서 받아 간 것) */
const isClaimedElsewhere = (r: RewardEntry) => !!r.claimed && !r.code;

function RewardTag({ r }: { r: RewardEntry }) {
  if (r.redeem.status === 'success') return <Tag tone="ok">{i18n.t('common.redeemed')}</Tag>;
  if (r.code) return <Tag tone="mute">{i18n.t('source.tagExtracted')}</Tag>;
  if (r.extractError) return <Tag tone="bad">{i18n.t('source.tagExtractFailed')}</Tag>;
  if (r.claimed) return <Tag tone="warn">{i18n.t('source.tagClaimed')}</Tag>;
  return <QuietTag>{i18n.t('source.tagNotExtracted')}</QuietTag>;
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
      {/* 진행 요약은 위에 고정하고, 나머지 높이는 전체 목록이 채운다 */}
      <div className="flex h-full flex-col">
        <ProgressHeader title={paused ? i18n.t('extracting.paused') : i18n.t('extracting.running')} index={job.index} total={job.queue.length}>
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
            const isCurrent = k === job.current || (!current && i === job.index && !paused);
            const done = i < job.index;
            return (
              <ProgressRow
                key={k}
                ref={isCurrent ? currentRef : undefined}
                first={i === 0}
                current={isCurrent}
                dim={!done && !isCurrent}
                thumb={r.imageUrl}
                name={r.name}
                status={
                  done ? (
                    r.code ? (
                      <CodeChip code={r.code} size="sm" />
                    ) : (
                      <StatusText tone="bad" title={r.extractError && tx(r.extractError)}>
                        {i18n.t('common.failed')}
                      </StatusText>
                    )
                  ) : isCurrent ? (
                    <StatusText tone="accent">{i18n.t('extracting.requesting')}</StatusText>
                  ) : (
                    <StatusText tone="faint">{i18n.t('common.waiting')}</StatusText>
                  )
                }
              />
            );
          })}
        </ProgressList>
        <FootNote>{i18n.t('common.keepsRunning')}</FootNote>
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
          {/* 추출한 코드가 없으면 다시 시도가 다음 할 일이라 주 버튼으로 둔다 */}
          {fail.length > 0 && (
            <Btn kind={ok.length > 0 ? 'ghost' : undefined} full onClick={() => retry(fail.map(rewardKey))}>
              {i18n.t('extractDone.retryAll', { count: fail.length })}
            </Btn>
          )}
          <Btn kind={ok.length > 0 ? undefined : 'ghost'} full onClick={() => browser.tabs.create({ url: keyClaimPageUrl(defaultBattlenetSite(uiLang())) })}>
            {i18n.t('common.openRedeemPage')}
          </Btn>
          <Btn kind="ghost" full onClick={() => sendToBackground({ type: 'job/clear' })}>
            {i18n.t('extractDone.backToList')}
          </Btn>
        </div>
      }
    >
      <div className="px-4 pb-4 pt-6">
        <h2 className="text-[16px] font-semibold">
          {job.status === 'stopped' ? i18n.t('extractDone.stopped') : i18n.t('extractDone.done', ok.length)}
        </h2>
        <p className="mt-1 text-[13px] text-sub">{i18n.t('extractDone.description')}</p>
        <div className="mt-4">
          <StatGrid
            items={[
              { label: i18n.t('extractDone.statOk'), value: ok.length, tone: 'ok' },
              { label: i18n.t('common.failed'), value: fail.length, tone: 'bad' },
            ]}
          />
        </div>
        {fail.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {fail.map((r) => (
              <FailCard
                key={rewardKey(r)}
                thumb={r.imageUrl}
                name={r.name}
                actions={
                  <Btn kind="ghost" size="sm" onClick={() => retry([rewardKey(r)])}>
                    {i18n.t('common.retry')}
                  </Btn>
                }
              >
                {r.extractError ? tx(r.extractError) : i18n.t('common.unknownError')}
              </FailCard>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
