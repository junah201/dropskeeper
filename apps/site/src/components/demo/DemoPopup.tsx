// 데모용 확장 팝업. 확장과 같은 popup-ui 부품과 문구로 apps/extension/src/entrypoints/popup/views의 화면을 따라 짠다.
// views의 화면 구성을 바꾸면 여기도 같이 맞춘다.
import {
  Btn,
  BusyLabel,
  CodeChip,
  Counts,
  ExpiryLine,
  FailCard,
  FilterChip,
  FootNote,
  Hint,
  IntroBody,
  ProgressHeader,
  ProgressList,
  ProgressRow,
  QueueRow,
  QuietTag,
  ResultTabs,
  RewardRow,
  SelectAllBar,
  SelectedCount,
  Shell,
  StatGrid,
  StatusText,
  TextBtn,
  sourceIcons,
  type Step,
} from '@dropskeeper/popup-ui';
import { LoaderCircle } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { FAIL_AT, N, rewards, type DemoReward } from './data';
import type { T } from './text';
import type { Scene } from './timeline';

// 데모 보상은 모두 SOOP 것이다
const badge = { src: sourceIcons.soop, name: 'SOOP' };
// 눌리는 순간의 버튼 모양 (확장의 active:scale-[0.98]와 hover 색)
const pressed = 'scale-[0.98] bg-accent-hover';

function Frame({ t, step, footer, children }: { t: T; step: Step; footer?: ComponentChildren; children: ComponentChildren }) {
  return (
    <Shell step={step} stepLabels={{ collect: t('step.collect'), redeem: t('step.redeem') }} logo="/favicon.svg" settingsLabel={t('common.settings')} footer={footer}>
      {children}
    </Shell>
  );
}

const expiry = (t: T, r: DemoReward) => <ExpiryLine text={t('expiry.daysLeft', { days: r.days })} campaign={r.campaign} />;

const selected = (t: T, count: number) => <SelectedCount template={t('common.selected', { count: '{count}' })} count={count} />;

const pauseStop = (t: T) => (
  <div className="grid grid-cols-2 gap-2">
    <Btn kind="ghost">{t('common.pause')}</Btn>
    <Btn kind="danger">{t('common.stop')}</Btn>
  </div>
);

export function DemoPopup({ scene, t }: { scene: Scene; t: T }) {
  switch (scene.kind) {
    // SourceView B1
    case 'intro':
    case 'loading': {
      const loading = scene.kind === 'loading';
      return (
        <Frame t={t} step="collect">
          <IntroBody title={t('source.introTitle', { name: 'SOOP' })} description={t('source.introDescription')}>
            <Btn full className={scene.kind === 'intro' && scene.pressing ? pressed : ''}>
              {loading ? <BusyLabel icon={<LoaderCircle size={16} strokeWidth={2} className="demo-spin" aria-hidden />}>{t('source.loading')}</BusyLabel> : t('source.load')}
            </Btn>
            <Hint>{t('source.loadHint')}</Hint>
          </IntroBody>
        </Frame>
      );
    }
    // SourceView B2
    case 'list': {
      const n = scene.checked;
      return (
        <Frame
          t={t}
          step="collect"
          footer={
            <div className="flex items-center gap-3">
              {selected(t, n)}
              <div className="flex-1">
                <Btn full disabled={n === 0} className={scene.pressing ? pressed : ''}>
                  {t('source.extract', { count: n })}
                </Btn>
              </div>
            </div>
          }
        >
          <div className="flex min-h-full flex-col">
            <SelectAllBar all={n === N} some={n > 0} label={t('common.selectAll')} action={<TextBtn>{t('source.reload')}</TextBtn>}>
              {t('source.shownOfTotal', { shown: N, total: N })}
            </SelectAllBar>
            <div className="flex flex-wrap items-center gap-2 px-4 py-2">
              <FilterChip on>{t('source.hideClaimed')}</FilterChip>
              <FilterChip on={false}>{t('source.hideExtracted')}</FilterChip>
            </div>
            <ul className="border-y border-line bg-panel">
              {rewards.map((r, i) => (
                <RewardRow key={r.code} first={i === 0} selectable checked={i < n} thumb={r.img} name={r.name} meta={expiry(t, r)} tag={<QuietTag>{t('source.tagNotExtracted')}</QuietTag>} />
              ))}
            </ul>
          </div>
        </Frame>
      );
    }
    // SourceView B3
    case 'extracting': {
      const done = scene.done;
      return (
        <Frame t={t} step="collect" footer={pauseStop(t)}>
          <div className="flex h-full flex-col">
            <ProgressHeader title={t('extracting.running')} index={done} total={N} />
            <ProgressList>
              {rewards.map((r, i) => (
                <ProgressRow
                  key={r.code}
                  first={i === 0}
                  current={i === done}
                  dim={i > done}
                  thumb={r.img}
                  name={r.name}
                  status={
                    i < done ? (
                      <CodeChip code={r.code} size="sm" />
                    ) : i === done ? (
                      <StatusText tone="accent">{t('extracting.requesting')}</StatusText>
                    ) : (
                      <StatusText tone="faint">{t('common.waiting')}</StatusText>
                    )
                  }
                />
              ))}
            </ProgressList>
            <FootNote>{t('common.keepsRunning')}</FootNote>
          </div>
        </Frame>
      );
    }
    // SourceView B4
    case 'extractDone':
      return (
        <Frame
          t={t}
          step="collect"
          footer={
            <div className="grid gap-2">
              <Btn full>{t('common.openRedeemPage')}</Btn>
              <Btn kind="ghost" full>
                {t('extractDone.backToList')}
              </Btn>
            </div>
          }
        >
          <div className="px-4 pb-4 pt-6">
            <h2 className="text-[16px] font-semibold">{t('extractDone.done', {}, N)}</h2>
            <p className="mt-1 text-[13px] text-sub">{t('extractDone.description')}</p>
            <div className="mt-4">
              <StatGrid
                items={[
                  { label: t('extractDone.statOk'), value: N, tone: 'ok' },
                  { label: t('common.failed'), value: 0, tone: 'bad' },
                ]}
              />
            </div>
          </div>
        </Frame>
      );
    // RedeemView C1
    case 'queue':
      return (
        <Frame
          t={t}
          step="redeem"
          footer={
            <div className="flex items-center gap-3">
              {selected(t, N)}
              <div className="flex flex-1 gap-2">
                <Btn kind="ghost">{t('common.delete')}</Btn>
                <div className="flex-1">
                  <Btn full className={scene.pressing ? pressed : ''}>
                    {t('redeem.start', { count: N })}
                  </Btn>
                </div>
              </div>
            </div>
          }
        >
          <SelectAllBar all some label={t('common.selectAll')}>
            {t('redeem.pendingCount', { count: N })}
          </SelectAllBar>
          <ul className="border-b border-line bg-panel">
            {rewards.map((r, i) => (
              <QueueRow
                key={r.code}
                first={i === 0}
                checked
                thumb={r.img}
                badge={badge}
                name={r.name}
                code={<CodeChip code={r.code} />}
                meta={expiry(t, r)}
                actions={<TextBtn>{t('common.copy')}</TextBtn>}
              />
            ))}
          </ul>
          <p className="px-4 py-3 text-[12px] text-faint">{t('redeem.pacingHint')}</p>
        </Frame>
      );
    // RedeemView C2
    case 'redeeming': {
      const done = scene.done;
      const fail = done > FAIL_AT ? 1 : 0;
      return (
        <Frame t={t} step="redeem" footer={pauseStop(t)}>
          <div className="flex h-full flex-col">
            <ProgressHeader title={t('redeem.running')} index={done} total={N}>
              <div className="mt-3">
                <Counts
                  items={[
                    { label: t('common.succeeded'), value: done - fail, tone: 'ok' },
                    { label: t('common.failed'), value: fail, tone: 'bad' },
                    { label: t('redeem.remaining'), value: N - done, tone: 'mute' },
                  ]}
                />
              </div>
            </ProgressHeader>
            <ProgressList>
              {rewards.map((r, i) => (
                <ProgressRow
                  key={r.code}
                  first={i === 0}
                  current={i === done}
                  dim={i > done}
                  thumb={r.img}
                  badge={badge}
                  name={r.name}
                  twoLine
                  code={<CodeChip code={r.code} size="sm" />}
                  status={
                    i === done ? (
                      <StatusText tone="accent">{t('redeem.statusRunning')}</StatusText>
                    ) : i < done ? (
                      i === FAIL_AT ? (
                        <StatusText tone="bad">{t('reason.already_used.label')}</StatusText>
                      ) : (
                        <StatusText tone="ok">{t('common.redeemed')}</StatusText>
                      )
                    ) : (
                      <StatusText tone="faint">{t('common.waiting')}</StatusText>
                    )
                  }
                />
              ))}
            </ProgressList>
            <FootNote>{t('common.keepsRunning')}</FootNote>
          </div>
        </Frame>
      );
    }
    // RedeemView C3
    case 'result': {
      const r = rewards[FAIL_AT];
      return (
        <Frame
          t={t}
          step="redeem"
          footer={
            <div className="grid gap-2">
              {/* 이미 사용된 코드는 다시 시도해도 소용없어 삭제가 주 버튼이 된다 */}
              <Btn full>{t('redeem.deleteHopeless', { count: 1 })}</Btn>
              <Btn kind="ghost" full>
                {t('redeem.backToQueue')}
              </Btn>
            </div>
          }
        >
          <div className="flex min-h-full flex-col">
            <ResultTabs
              tabs={[
                { id: 'fail', label: t('common.failed'), count: 1 },
                { id: 'ok', label: t('common.succeeded'), count: N - 1 },
              ]}
              value="fail"
            />
            <ul className="grid gap-2 px-4 py-3">
              <FailCard
                thumb={r.img}
                badge={badge}
                name={r.name}
                code={<CodeChip code={r.code} />}
                actions={
                  <Btn kind="ghost" size="sm">
                    {t('common.delete')}
                  </Btn>
                }
              >
                <span className="font-medium">{t('reason.already_used.label')}</span> · {t('reason.already_used.help')}
              </FailCard>
            </ul>
          </div>
        </Frame>
      );
    }
  }
}
