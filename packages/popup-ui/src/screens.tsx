// 팝업 화면을 이루는 큰 조각(목록 행, 진행 머리말, 실패 카드 등).
// 확장의 views/*.tsx와 소개 사이트의 데모가 같은 조각으로 화면을 짠다. 데이터와 문구는 쓰는 쪽이 채운다.
import type { ComponentChildren, Ref } from 'preact';
import { Bar, Check, Thumb } from './parts';

type Badge = { src: string; name: string };

/** 처음 화면: 제목·설명이 위, 버튼이 맨 아래 (드롭스 인벤토리에서 처음 열었을 때) */
export function IntroBody({ title, description, notice, children }: { title: string; description: string; notice?: ComponentChildren; children: ComponentChildren }) {
  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-6">
      {/* 줄바꿈은 번역문에 넣고 whitespace-pre-line으로 살린다 */}
      <h2 className="whitespace-pre-line text-[16px] font-semibold leading-snug">{title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-sub">{description}</p>
      {notice && <div className="mt-4">{notice}</div>}
      <div className="mt-auto">{children}</div>
    </div>
  );
}

/** 버튼 안 "불러오는 중" 표시. 블록 flex로 버튼 높이 가운데에 놓는다. */
export function BusyLabel({ icon, children }: { icon: ComponentChildren; children: ComponentChildren }) {
  return (
    <span className="flex items-center justify-center gap-2">
      {icon}
      {children}
    </span>
  );
}

/** 버튼 아래 작은 안내 */
export function Hint({ children }: { children: ComponentChildren }) {
  return <p className="mt-2 text-center text-[12px] text-faint">{children}</p>;
}

/** 보상 목록의 한 줄. 코드가 있는 보상은 고를 수 없어 체크박스 자리만 비운다. */
export function RewardRow({
  first,
  selectable,
  checked,
  dim,
  onClick,
  thumb,
  name,
  meta,
  tag,
}: {
  first: boolean;
  selectable: boolean;
  checked: boolean;
  dim?: boolean;
  onClick?: () => void;
  thumb?: string;
  name: string;
  /** 이름 아래 줄 (만료일 · 캠페인) */
  meta?: ComponentChildren;
  tag?: ComponentChildren;
}) {
  return (
    // 행 어디를 눌러도 선택된다. 체크박스 클릭도 이 onClick으로 전달된다.
    <li
      onClick={selectable ? onClick : undefined}
      className={`flex items-center gap-2 px-3 py-2 ${first ? '' : 'border-t border-line'} ${dim ? 'opacity-55' : ''} ${
        selectable ? 'cursor-pointer select-none hover:bg-bg' : ''
      }`}
    >
      {selectable ? <Check on={checked} label={name} /> : <span className="w-4 shrink-0" />}
      <Thumb src={thumb} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium">{name}</div>
        {/* 만료일이 잘리지 않도록 캠페인 이름보다 앞에 둔다 */}
        {meta}
      </div>
      {tag}
    </li>
  );
}

/** 진행 화면 위쪽 요약: 제목, n / 전체, 진행 막대. children은 그 아래에 붙는다. */
export function ProgressHeader({ title, index, total, children }: { title: string; index: number; total: number; children?: ComponentChildren }) {
  return (
    <div className="px-4 pt-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        <span className="font-mono text-[18px] font-medium tabular-nums">
          {index}
          <span className="text-faint"> / {total}</span>
        </span>
      </div>
      <div className="mt-3">
        <Bar value={index} total={total} />
      </div>
      {children}
    </div>
  );
}

/** 진행 화면의 전체 대기열 목록. 남은 높이를 채우고 안에서 스크롤된다. */
export function ProgressList({ children }: { children: ComponentChildren }) {
  return <ul className="mx-3 mt-4 min-h-0 flex-1 overflow-y-auto rounded-[10px] border border-line bg-panel text-[13px]">{children}</ul>;
}

/** 진행 목록의 한 줄. current는 강조, dim은 아직 차례가 아닌 줄 */
export function ProgressRow({
  ref,
  first,
  current,
  dim,
  thumb,
  badge,
  name,
  code,
  twoLine,
  status,
}: {
  ref?: Ref<HTMLLIElement>;
  first: boolean;
  current: boolean;
  dim: boolean;
  thumb?: string;
  badge?: Badge;
  name: string;
  /** 이름 아래 코드 칩 (twoLine일 때) */
  code?: ComponentChildren;
  /** 이름 아래에 코드를 두는 두 줄 모양 (등록 화면) */
  twoLine?: boolean;
  status: ComponentChildren;
}) {
  return (
    <li ref={ref} className={`flex items-center gap-3 px-3 py-2 ${first ? '' : 'border-t border-line'} ${current ? 'bg-accent-soft' : ''} ${dim ? 'opacity-50' : ''}`}>
      <Thumb src={thumb} badge={badge} />
      {twoLine ? (
        <div className="min-w-0 flex-1">
          <div className="truncate">{name}</div>
          {code && <div className="mt-1">{code}</div>}
        </div>
      ) : (
        <span className="min-w-0 flex-1 truncate">{name}</span>
      )}
      {status}
    </li>
  );
}

const statusClass = {
  accent: 'font-medium text-accent',
  ok: 'font-medium text-ok',
  bad: 'font-medium text-bad',
  faint: 'text-faint',
  timer: 'font-mono text-sub tabular-nums',
} as const;

/** 진행 목록 오른쪽의 상태 글자 (요청 중…, 대기, 등록됨, 실패 이유) */
export function StatusText({ tone, title, children }: { tone: keyof typeof statusClass; title?: string; children: ComponentChildren }) {
  return (
    <span className={`shrink-0 ${statusClass[tone]}`} title={title}>
      {children}
    </span>
  );
}

/** 화면 맨 아래 작은 안내 (팝업을 닫아도 계속 진행돼요) */
export function FootNote({ children }: { children: ComponentChildren }) {
  return <p className="px-4 py-3 text-[12px] text-faint">{children}</p>;
}

/** 등록 대기 목록의 한 줄: 체크, 썸네일, 이름, 코드·만료일, 오른쪽 글자 버튼 */
export function QueueRow({
  first,
  checked,
  onClick,
  thumb,
  badge,
  name,
  code,
  meta,
  failedText,
  actions,
}: {
  first: boolean;
  checked: boolean;
  onClick?: () => void;
  thumb?: string;
  badge?: Badge;
  name: string;
  code: ComponentChildren;
  meta?: ComponentChildren;
  /** 지난 시도에서 실패한 이유 */
  failedText?: string;
  actions?: ComponentChildren;
}) {
  return (
    // 행 어디를 눌러도 선택된다. 체크박스 클릭도 이 onClick으로 전달된다.
    <li onClick={onClick} className={`flex cursor-pointer select-none items-center gap-3 px-3 py-2 hover:bg-bg ${first ? '' : 'border-t border-line'}`}>
      <Check on={checked} label={name} />
      <Thumb src={thumb} size="lg" badge={badge} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium">{name}</div>
        {/* 코드와 만료일을 한 줄에 두어 "무엇을, 언제까지"가 같이 읽히게 한다 */}
        <div className="mt-1 flex items-center gap-2">
          {code}
          <div className="min-w-0">{meta}</div>
        </div>
        {failedText && <div className="mt-1 text-[12px] text-bad">{failedText}</div>}
      </div>
      {actions}
    </li>
  );
}

/** 실패한 항목 카드: 이름·코드·버튼, 아래에 빨간 이유 칸. 추출 실패와 등록 실패가 같은 모양을 쓴다. */
export function FailCard({ thumb, badge, name, code, actions, children }: { thumb?: string; badge?: Badge; name: string; code?: ComponentChildren; actions?: ComponentChildren; children: ComponentChildren }) {
  return (
    <li className="rounded-[10px] border border-line bg-panel p-3">
      <div className={`flex justify-between gap-2 ${code ? 'items-start' : 'items-center'}`}>
        <Thumb src={thumb} badge={badge} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium">{name}</div>
          {code && <div className="mt-1">{code}</div>}
        </div>
        {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
      </div>
      <div className="mt-2 break-words rounded bg-bad-soft p-2 text-[12px] text-bad">{children}</div>
    </li>
  );
}

/** 결과 화면의 실패 / 성공 탭 */
export function ResultTabs<T extends string>({ tabs, value, onChange }: { tabs: readonly { id: T; label: string; count: number }[]; value: T; onChange?: (id: T) => void }) {
  return (
    <div role="tablist" className="flex border-b border-line px-4 pt-3 text-[14px]">
      {tabs.map(({ id, label, count }) => (
        <button
          key={id}
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange?.(id)}
          className={`border-b-2 px-3 pb-2 font-medium ${value === id ? 'border-ink text-ink' : 'border-transparent text-faint'}`}
        >
          {label} <span className="font-mono tabular-nums">{count}</span>
        </button>
      ))}
    </div>
  );
}

/** 성공 탭의 한 줄 */
export function DoneRow({ first, thumb, badge, name, tag }: { first: boolean; thumb?: string; badge?: Badge; name: string; tag: ComponentChildren }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-2 ${first ? '' : 'border-t border-line'}`}>
      <Thumb src={thumb} badge={badge} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{name}</span>
      {tag}
    </li>
  );
}
