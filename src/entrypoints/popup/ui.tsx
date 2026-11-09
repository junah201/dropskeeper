import { useState, type ReactNode } from 'react';
import type { RewardEntry, SourceId } from '@/lib/types';
import { fmtDate, fmtExpiry } from '@/lib/expiry';
import { sourceMetas } from '@/lib/sources/hosts';
import soopIcon from '@/assets/sources/soop.png';
import chzzkIcon from '@/assets/sources/chzzk.png';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { usePopup } from './context';

export type Step = 'collect' | 'redeem' | null;

/** 헤더의 아이콘 버튼. 아이콘은 lucide 16px, 선 굵기 1.5로 맞춘다. */
function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg text-sub transition-colors hover:bg-bg hover:text-ink"
    >
      {children}
    </button>
  );
}

export function Shell({
  step,
  children,
  footer,
  title,
}: {
  step: Step;
  children: ReactNode;
  footer?: ReactNode;
  /** 주면 로고 대신 뒤로 가기와 제목을 보여 준다 (설정 화면) */
  title?: string;
}) {
  const { openSettings, closeSettings } = usePopup();
  const steps = [
    { id: 'collect', label: '수집' },
    { id: 'redeem', label: '등록' },
  ] as const;
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center justify-between border-b border-line bg-panel px-4">
        {title ? (
          <div className="-ml-2 flex items-center gap-1">
            <IconBtn label="뒤로" onClick={closeSettings}>
              <ArrowLeft size={16} strokeWidth={1.5} />
            </IconBtn>
            <h1 className="text-[14px] font-semibold">{title}</h1>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-ink font-mono text-[12px] font-medium text-white">dk</div>
              <span className="text-[14px] font-semibold">DropsKeeper</span>
            </div>
            <div className="-mr-2 flex items-center gap-2">
              <ol className="flex items-center gap-1 font-mono text-[12px]">
                {steps.map((s, i) => {
                  const on = s.id === step;
                  return (
                    <li key={s.id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-check">→</span>}
                      <span className={`rounded px-1.5 py-0.5 ${on ? 'bg-accent-soft font-medium text-accent' : 'text-faint'}`}>
                        {i + 1} {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <IconBtn label="설정" onClick={openSettings}>
                <SettingsIcon size={16} strokeWidth={1.5} />
              </IconBtn>
            </div>
          </>
        )}
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      {footer && <footer className="border-t border-line bg-panel px-4 py-3">{footer}</footer>}
    </div>
  );
}

type BtnKind = 'primary' | 'ghost' | 'danger';
const btnClass: Record<BtnKind, string> = {
  primary: 'border-accent bg-accent text-white hover:bg-accent-hover disabled:border-check disabled:bg-check',
  ghost: 'border-line bg-panel text-ink hover:bg-bg disabled:text-faint',
  danger: 'border-line bg-panel text-bad hover:bg-bad-soft',
};

export function Btn({
  children,
  kind = 'primary',
  full,
  size = 'md',
  ...rest
}: { children: ReactNode; kind?: BtnKind; full?: boolean; size?: 'sm' | 'md' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`shrink-0 rounded-lg border font-medium transition-[background-color,border-color,color] active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${
        size === 'sm' ? 'h-7 px-3 text-[13px]' : 'h-9 px-3 text-[14px]'
      } ${btnClass[kind]} ${full ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}

export function Check({ on, mixed, onChange, label }: { on: boolean; mixed?: boolean; onChange?: () => void; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? 'mixed' : on}
      aria-label={label}
      onClick={onChange}
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border-[1.5px] transition-colors ${
        on || mixed ? 'border-accent bg-accent' : 'border-check bg-panel'
      }`}
    >
      {on && !mixed && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {mixed && <span className="h-[2px] w-2 rounded bg-white" />}
    </button>
  );
}

export type Tone = 'ok' | 'bad' | 'warn' | 'mute' | 'accent';
const toneClass: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok',
  bad: 'bg-bad-soft text-bad',
  warn: 'bg-warn-soft text-warn',
  mute: 'bg-mute-soft text-sub',
  accent: 'bg-accent-soft text-accent',
};

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[12px] font-medium ${toneClass[tone]}`}>{children}</span>;
}

export function Bar({ value, total }: { value: number; total: number }) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={value} aria-valuemax={total}>
      {/* 폭 대신 transform을 움직여 레이아웃을 다시 계산하지 않게 한다 */}
      <div
        className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}

const thumbSize = { md: 'h-8 w-8', lg: 'h-10 w-10' } as const;

/** 플랫폼 아이콘. 외부 요청 없이 확장에 번들한 파비콘을 쓴다. */
const sourceIcon: Record<SourceId, string> = { soop: soopIcon, chzzk: chzzkIcon };

/**
 * 보상 썸네일. source를 주면 오른쪽 아래 모서리에 플랫폼 배지를 단다.
 * 여러 플랫폼 보상이 섞여 나오는 등록 화면에서 어느 플랫폼 것인지 구분하게 한다.
 */
export function Thumb({ src, size = 'md', source }: { src?: string; size?: keyof typeof thumbSize; source?: SourceId }) {
  if (!source) return <ThumbImage src={src} size={size} />;
  const name = sourceMetas[source].name;
  return (
    <span className="relative shrink-0" title={name}>
      <ThumbImage src={src} size={size} />
      <img
        src={sourceIcon[source]}
        alt={name}
        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-[4px] ring-2 ring-panel"
      />
    </span>
  );
}

function ThumbImage({ src, size }: { src?: string; size: keyof typeof thumbSize }) {
  const [broken, setBroken] = useState(false);
  // 이미지가 없거나 불러오지 못하면 회색 칸으로 자리만 유지한다
  return src && !broken ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={`${thumbSize[size]} shrink-0 rounded-md border border-line bg-bg object-cover`}
    />
  ) : (
    <span className={`${thumbSize[size]} shrink-0 rounded-md bg-line`} />
  );
}

export function Notice({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <div className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${toneClass[tone]}`}>{children}</div>;
}

const figureTone = { accent: 'text-accent', ok: 'text-ok', bad: 'text-bad' } as const;

/**
 * 숫자 칸 묶음. tone은 값이 0보다 클 때만 칠해서, 실패 0개 같은 숫자가 빨갛게 튀지 않게 한다.
 */
export function StatGrid({ items }: { items: { label: string; value: number; tone?: keyof typeof figureTone }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
      {items.map(({ label, value, tone }) => (
        <div key={label} className="bg-panel px-4 py-3">
          <dt className="text-[13px] text-sub">{label}</dt>
          <dd className={`mt-1 font-mono text-[18px] font-medium leading-6 tabular-nums ${tone && value > 0 ? figureTone[tone] : 'text-ink'}`}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 진행 중 개수 줄. 색은 점에만 두고 숫자는 mono로 조용히 적는다. */
export function Counts({ items }: { items: { label: string; value: number; dot: string }[] }) {
  return (
    <dl className="flex items-center gap-4 text-[13px]">
      {items.map(({ label, value, dot }) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
          <dt className="text-sub">{label}</dt>
          <dd className="font-mono tabular-nums text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const mask = (code: string) => {
  const p = code.split('-');
  if (p.length < 3) return code.slice(0, 4) + '••••' + code.slice(-4);
  return [p[0], ...p.slice(1, -1).map((x) => '•'.repeat(x.length)), p[p.length - 1]].join('-');
};

/**
 * 마스킹한 코드 칩. DropsKeeper의 코드는 어느 화면에서든 이 모양 하나로 보인다.
 * 보이는 앞뒤 글자는 진하게, 가린 자리는 옅게 그려서 코드의 생김새를 읽을 수 있게 한다.
 */
export function CodeChip({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' }) {
  const { settings } = usePopup();
  // 가운데 조각이 여럿이어도 •••• 한 덩어리로 줄인다. 조각마다 점을 다 찍으면 칩이 길어져 이름과 만료일이 잘린다.
  const parts = (settings.maskCodes ? mask(code) : code)
    .replace(/•[•-]*•/, '••••')
    .split(/(•+)/)
    .filter(Boolean);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[4px] border border-line bg-bg px-2 font-mono tabular-nums text-ink ${
        size === 'sm' ? 'h-5 text-[12px]' : 'h-6 text-[13px]'
      }`}
    >
      {parts.map((p, i) =>
        p.startsWith('•') ? (
          <span key={i} className="text-check" aria-hidden>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}

export function SelectAllBar({ all, some, onToggle, children }: { all: boolean; some: boolean; onToggle: () => void; children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex h-10 items-center gap-2 border-b border-line bg-bg px-3 text-[13px]">
      <Check on={all} mixed={!all && some} onChange={onToggle} label="전체 선택" />
      <button type="button" onClick={onToggle} className="font-medium">
        전체 선택
      </button>
      <span className="truncate text-faint">{children}</span>
    </div>
  );
}

/**
 * 만료일(D-n) · 캠페인 이름. 만료가 가까우면 D-n을 주황색으로 강조한다.
 * 정확한 날짜와 잘린 캠페인 이름은 마우스를 올리면 보인다.
 */
export function ExpiryLine({ r }: { r: RewardEntry }) {
  const exp = fmtExpiry(r.expiresAt);
  const tip = [exp.text && `${fmtDate(r.expiresAt)} 만료`, r.campaign].filter(Boolean).join(' · ');
  return (
    <div className="truncate text-[12px] text-faint" title={tip || undefined}>
      {exp.text && (
        <span
          className={`font-mono tabular-nums ${exp.soon ? 'font-medium text-warn' : ''}`}
        >
          {exp.text}
        </span>
      )}
      {exp.text && r.campaign ? ' · ' : ''}
      {r.campaign}
    </div>
  );
}

/** 켜고 끄는 스위치 */
export function Switch({ on, onChange, label, describedBy }: { on: boolean; onChange: (next: boolean) => void; label: string; describedBy?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-describedby={describedBy}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-check'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
