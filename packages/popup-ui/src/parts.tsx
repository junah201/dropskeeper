// 팝업의 작은 화면 부품. 문구와 동작은 모두 props로 받고, 확장 API(browser, #i18n)는 쓰지 않는다.
// 확장은 apps/extension/src/entrypoints/popup/ui.tsx에서 번역과 설정을 채워 쓴다.
import { Fragment, type ButtonHTMLAttributes, type ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-preact';

export type Step = 'collect' | 'redeem' | null;

/** 헤더의 아이콘 버튼. 아이콘은 lucide 16px, 선 굵기 1.5로 맞춘다. */
export function IconBtn({ label, onClick, children }: { label: string; onClick?: () => void; children: ComponentChildren }) {
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

export interface ShellProps {
  step: Step;
  stepLabels: { collect: string; redeem: string };
  logo: string;
  settingsLabel: string;
  onSettings?: () => void;
  /** 주면 로고 대신 뒤로 가기와 제목을 보여 준다 (설정 화면) */
  back?: { title: string; label: string; onClick: () => void };
  /** 주면 로고와 이름을 새 탭으로 여는 링크로 감싼다 (사이트 데모에서는 비워 둔다) */
  home?: { href: string; label: string };
  children: ComponentChildren;
  footer?: ComponentChildren;
}

export function Shell({ step, stepLabels, logo, settingsLabel, onSettings, back, home, children, footer }: ShellProps) {
  const brand = (
    <>
      <img src={logo} alt="" width={24} height={24} className="h-6 w-6" />
      <span className="text-[14px] font-semibold">DropsKeeper</span>
    </>
  );
  const steps = [
    { id: 'collect', label: stepLabels.collect },
    { id: 'redeem', label: stepLabels.redeem },
  ] as const;
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 items-center justify-between border-b border-line bg-panel px-4">
        {back ? (
          <div className="-ml-2 flex items-center gap-1">
            <IconBtn label={back.label} onClick={back.onClick}>
              <ArrowLeft size={16} strokeWidth={1.5} />
            </IconBtn>
            <h1 className="text-[14px] font-semibold">{back.title}</h1>
          </div>
        ) : (
          <>
            {home ? (
              <a
                href={home.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={home.label}
                title={home.label}
                className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-0.5 transition-opacity hover:opacity-75"
              >
                {brand}
              </a>
            ) : (
              <div className="flex items-center gap-2">{brand}</div>
            )}
            <div className="-mr-2 flex items-center gap-2">
              <ol className="flex items-center gap-1 font-mono text-[12px]">
                {steps.map((s, i) => {
                  const on = s.id === step;
                  return (
                    <li key={s.id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-check">→</span>}
                      <span className={`rounded px-1.5 py-0.5 ${on ? 'ticket bg-accent-soft font-medium text-accent [--notch:3px]' : 'text-faint'}`}>
                        {i + 1} {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <IconBtn label={settingsLabel} onClick={onSettings}>
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
  className = '',
  ...rest
}: { children: ComponentChildren; kind?: BtnKind; full?: boolean; size?: 'sm' | 'md' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`shrink-0 rounded-lg border font-medium transition-[background-color,border-color,color] active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${
        size === 'sm' ? 'h-7 px-3 text-[13px]' : 'h-9 px-3 text-[14px]'
      } ${btnClass[kind]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

/** 체크박스와 필터 칩 안의 흰 체크 표시. 그리는 칸 크기에 맞춰 size와 선 굵기만 바꾼다. */
function CheckMark({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#fff" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
      {on && !mixed && <CheckMark size={10} strokeWidth={1.8} />}
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

export function Tag({ tone, children }: { tone: Tone; children: ComponentChildren }) {
  return <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[12px] font-medium ${toneClass[tone]}`}>{children}</span>;
}

/** 기본 상태라 알약 없이 옅은 글자로만 적는 태그 (예: 미추출) */
export function QuietTag({ children }: { children: ComponentChildren }) {
  return <span className="whitespace-nowrap px-1.5 text-[12px] text-faint">{children}</span>;
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

/**
 * 보상 썸네일. badge를 주면 오른쪽 아래 모서리에 플랫폼 배지를 단다.
 * 여러 플랫폼 보상이 섞여 나오는 등록 화면에서 어느 플랫폼 것인지 구분하게 한다.
 */
export function Thumb({ src, size = 'md', badge }: { src?: string; size?: keyof typeof thumbSize; badge?: { src: string; name: string } }) {
  if (!badge) return <ThumbImage src={src} size={size} />;
  return (
    <span className="relative shrink-0" title={badge.name}>
      <ThumbImage src={src} size={size} />
      <img src={badge.src} alt={badge.name} className="absolute -bottom-1 -right-1 h-4 w-4 rounded-[4px] ring-2 ring-panel" />
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

export function Notice({ tone, children }: { tone: Tone; children: ComponentChildren }) {
  return <div className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${toneClass[tone]}`}>{children}</div>;
}

/** 다음에 할 일을 번호를 붙여 보여 주는 상자. hint는 단계 아래 작은 글씨로 붙는다. */
export function NextSteps({ title, steps, hint }: { title: string; steps: ComponentChildren[]; hint?: ComponentChildren }) {
  return (
    <section className="rounded-[10px] border border-accent/30 bg-accent-soft px-4 py-3">
      <h3 className="text-[13px] font-semibold text-accent">{title}</h3>
      <ol className="mt-2 grid gap-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink">
            <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-accent font-mono text-[11px] font-semibold text-white">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {hint && <p className="mt-2 text-[12px] leading-relaxed text-sub">{hint}</p>}
    </section>
  );
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

const dotClass: Record<Tone, string> = {
  ok: 'bg-ok',
  bad: 'bg-bad',
  warn: 'bg-warn',
  mute: 'bg-check',
  accent: 'bg-accent',
};

/** 진행 중 개수 줄. 색은 점에만 두고 숫자는 mono로 조용히 적는다. */
export function Counts({ items }: { items: { label: string; value: number; tone: Tone }[] }) {
  return (
    <dl className="flex items-center gap-4 text-[13px]">
      {items.map(({ label, value, tone }) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} aria-hidden />
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
export function CodeChip({ code, size = 'md', masked = true }: { code: string; size?: 'sm' | 'md'; masked?: boolean }) {
  // 가운데 조각이 여럿이어도 •••• 한 덩어리로 줄인다. 조각마다 점을 다 찍으면 칩이 길어져 이름과 만료일이 잘린다.
  const parts = (masked ? mask(code) : code)
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

export function SelectAllBar({
  all,
  some,
  onToggle,
  label,
  action,
  children,
}: {
  all: boolean;
  some: boolean;
  onToggle?: () => void;
  label: string;
  /** 줄 오른쪽 끝에 붙는 버튼 (예: 다시 불러오기) */
  action?: ComponentChildren;
  children?: ComponentChildren;
}) {
  return (
    <div className="sticky top-0 z-10 flex h-10 items-center gap-2 border-b border-line bg-bg px-4 text-[13px]">
      <Check on={all} mixed={!all && some} onChange={onToggle} label={label} />
      <button type="button" onClick={onToggle} className="shrink-0 font-medium">
        {label}
      </button>
      <span className="min-w-0 truncate text-faint">{children}</span>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

/** 목록 줄 오른쪽 끝의 글자 버튼 (다시 불러오기, 복사, 삭제) */
export function TextBtn({ tone = 'accent', children, ...rest }: { tone?: 'accent' | 'bad'; children: ComponentChildren } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`shrink-0 text-[12px] font-medium underline-offset-2 hover:underline disabled:text-faint disabled:no-underline ${tone === 'bad' ? 'text-bad' : 'text-accent'}`}
    >
      {children}
    </button>
  );
}

/**
 * 켜고 끄는 필터. 상태 태그(Tag)와 구분되도록 테두리·체크 표시·24px 높이를 가진 버튼 모양으로 그린다.
 */
export function FilterChip({ on, onClick, children }: { on: boolean; onClick?: () => void; children: ComponentChildren }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[12px] font-medium transition-colors ${
        on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel text-sub hover:border-check hover:text-ink'
      }`}
    >
      <span className={`grid h-3 w-3 place-items-center rounded-[3px] ${on ? 'bg-accent' : 'border border-check'}`} aria-hidden>
        {on && <CheckMark size={8} strokeWidth={2} />}
      </span>
      {children}
    </button>
  );
}

/** 필터 줄의 한 번 누르는 버튼 (예: 미획득만 선택) */
export function ChipBtn({ onClick, children }: { onClick?: () => void; children: ComponentChildren }) {
  return (
    <button
      type="button"
      className="inline-flex h-6 items-center rounded-md border border-line bg-panel px-2 text-[12px] font-medium text-ink hover:bg-bg"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * 만료일(D-n) · 캠페인 이름. 만료가 가까우면 D-n을 주황색으로 강조한다.
 * 정확한 날짜와 잘린 캠페인 이름은 마우스를 올리면 보인다.
 */
export function ExpiryLine({ text, soon, campaign, tip }: { text?: string; soon?: boolean; campaign?: string; tip?: string }) {
  return (
    <div className="truncate text-[12px] text-faint" title={tip || undefined}>
      {text && <span className={`font-mono tabular-nums ${soon ? 'font-medium text-warn' : ''}`}>{text}</span>}
      {text && campaign ? ' · ' : ''}
      {campaign}
    </div>
  );
}

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

/**
 * 번역문의 `{name}` 자리에 Preact 요소를 끼운다. 문장 속 숫자만 굵기·글꼴을 달리 그릴 때 쓴다.
 * 예: <Rich text="{count}개 선택" values={{ count: <b>3</b> }} />
 */
export function Rich({ text, values }: { text: string; values: Record<string, ComponentChildren> }) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((part, i) => {
        const name = /^\{(\w+)\}$/.exec(part)?.[1];
        return <Fragment key={i}>{name && name in values ? values[name] : part}</Fragment>;
      })}
    </>
  );
}

/** "3개 선택" 줄. 숫자만 진하게 그린다. template은 `{count}` 자리표시자가 든 문구 */
export function SelectedCount({ template, count }: { template: string; count: number }) {
  return (
    <span className="text-[13px] text-sub">
      <Rich text={template} values={{ count: <span className="font-medium text-ink">{count}</span> }} />
    </span>
  );
}
