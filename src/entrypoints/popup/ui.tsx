import type { ReactNode } from 'react';

export type Step = 'collect' | 'redeem' | null;

export function Shell({ step, host, children, footer }: { step: Step; host?: string; children: ReactNode; footer?: ReactNode }) {
  const steps = [
    { id: 'collect', label: '수집' },
    { id: 'redeem', label: '등록' },
  ] as const;
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line bg-panel px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-[5px] bg-ink text-[10px] font-bold text-white">dk</div>
          <span className="text-[13px] font-semibold">dropkeeper</span>
        </div>
        <ol className="flex items-center gap-1 font-mono text-[11px]">
          {steps.map((s, i) => {
            const on = s.id === step;
            return (
              <li key={s.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-faint">→</span>}
                <span className={`rounded px-1.5 py-0.5 ${on ? 'bg-accent-soft font-semibold text-accent' : 'text-faint'}`}>
                  {i + 1} {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </header>
      {host && <div className="px-4 pt-2 font-mono text-[11px] text-faint">{host}</div>}
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
      className={`shrink-0 rounded-md border font-semibold transition-colors disabled:cursor-not-allowed ${
        size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-3 text-[13px]'
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
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border-[1.5px] ${
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
  mute: 'bg-[#eef0f3] text-sub',
  accent: 'bg-accent-soft text-accent',
};

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${toneClass[tone]}`}>{children}</span>;
}

export function Bar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={value} aria-valuemax={total}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Thumb({ src }: { src?: string }) {
  return src ? (
    <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-[5px] border border-line bg-bg object-cover" />
  ) : (
    <span className="h-8 w-8 shrink-0 rounded-[5px] bg-line" />
  );
}

export function Notice({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <div className={`rounded-md px-3 py-2.5 text-[12px] leading-relaxed ${toneClass[tone]}`}>{children}</div>;
}

export function StatGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line text-[12px]">
      {items.map(([k, v]) => (
        <div key={k} className="bg-panel px-3 py-2">
          <dt className="text-faint">{k}</dt>
          <dd className="mt-0.5 font-semibold">{v}</dd>
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


export function SelectAllBar({ all, some, onToggle, children }: { all: boolean; some: boolean; onToggle: () => void; children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-bg px-4 py-2 text-[12px]">
      <Check on={all} mixed={!all && some} onChange={onToggle} label="전체 선택" />
      <button type="button" onClick={onToggle} className="font-semibold">
        전체 선택
      </button>
      <span className="truncate text-faint">{children}</span>
    </div>
  );
}
