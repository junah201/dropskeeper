// 팝업 화면 부품. 모양은 @dropskeeper/popup-ui에 있고(소개 사이트 데모와 같이 쓴다),
// 여기서는 번역(#i18n)과 팝업 설정(usePopup)을 채워 views가 짧게 쓰도록 감싼다.
import type { ComponentChildren } from 'preact';
import { i18n } from '#i18n';
import type { RewardEntry, SourceId } from '@/lib/types';
import { expiryDays, fmtDate } from '@/lib/expiry';
import { sourceMetas } from '@/lib/sources/hosts';
import * as UI from '@dropskeeper/popup-ui';
import { usePopup } from './context';

export { Bar, Btn, Check, Counts, FilterChip, Notice, Rich, StatGrid, Switch, Tag, mask, type Step, type Tone } from '@dropskeeper/popup-ui';

export function Shell({
  step,
  children,
  footer,
  title,
}: {
  step: UI.Step;
  children: ComponentChildren;
  footer?: ComponentChildren;
  title?: string;
}) {
  const { openSettings, closeSettings } = usePopup();
  return (
    <UI.Shell
      step={step}
      stepLabels={{ collect: i18n.t('step.collect'), redeem: i18n.t('step.redeem') }}
      logo="/icon.svg"
      settingsLabel={i18n.t('common.settings')}
      onSettings={openSettings}
      back={title ? { title, label: i18n.t('common.back'), onClick: closeSettings } : undefined}
      footer={footer}
    >
      {children}
    </UI.Shell>
  );
}

/** 플랫폼 배지(썸네일 오른쪽 아래 아이콘) */
export const sourceBadge = (source: SourceId) => ({ src: UI.sourceIcons[source], name: sourceMetas[source].name });

export function Thumb({ src, size, source }: { src?: string; size?: 'md' | 'lg'; source?: SourceId }) {
  return <UI.Thumb src={src} size={size} badge={source && sourceBadge(source)} />;
}

/** 코드 칩. 설정의 "코드 가리기"를 따른다. */
export function CodeChip({ code, size }: { code: string; size?: 'sm' | 'md' }) {
  const { settings } = usePopup();
  return <UI.CodeChip code={code} size={size} masked={settings.maskCodes} />;
}

export function SelectAllBar(props: { all: boolean; some: boolean; onToggle: () => void; action?: ComponentChildren; children?: ComponentChildren }) {
  return <UI.SelectAllBar {...props} label={i18n.t('common.selectAll')} />;
}

export function ExpiryLine({ r }: { r: RewardEntry }) {
  const exp = expiryDays(r.expiresAt);
  const text = exp ? (exp.days === 0 ? i18n.t('expiry.today') : i18n.t('expiry.daysLeft', { days: exp.days })) : undefined;
  const tip = [exp && i18n.t('expiry.expiresOn', { date: fmtDate(r.expiresAt) }), r.campaign].filter(Boolean).join(' · ');
  return <UI.ExpiryLine text={text} soon={exp?.soon} campaign={r.campaign} tip={tip} />;
}

export function SelectedCount({ count }: { count: number }) {
  return <UI.SelectedCount template={i18n.t('common.selected', { count: '{count}' })} count={count} />;
}
