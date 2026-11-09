// 데모에서 팝업 뒤에 보이는 사이트 화면: 브라우저 창, SOOP 드롭스 보관함, Battle.net 코드 등록 페이지.
// 실제 사이트를 흉내 낸 그림일 뿐이고, 로고는 그리지 않는다.
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Bell, Check, Grip, LoaderCircle, Lock, Search, Video } from 'lucide-preact';
import { sourceIcons } from '@dropskeeper/popup-ui';
import type { Copy } from '../../i18n';
import { N, rewards } from './data';
import type { BnState } from './timeline';

type DemoCopy = Copy['demo'];

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** 브라우저 창. 오른쪽 위 확장 아이콘 아래에 팝업을 띄운다. */
export function BrowserFrame({ url, dark, popup, children }: { url: string; dark?: boolean; popup: ComponentChildren; children: ComponentChildren }) {
  return (
    <div className={cx('relative rounded-xl border shadow-2xl', dark ? 'border-[#2a2c32] bg-bn-bg' : 'border-line bg-panel')}>
      <div className={cx('flex h-10 items-center gap-3 rounded-t-xl border-b px-3', dark ? 'border-[#2a2c32] bg-[#1f2125]' : 'border-line bg-mute-soft')}>
        <div className="flex gap-1.5" aria-hidden>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className={cx('flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px]', dark ? 'bg-[#121316] text-bn-sub' : 'bg-panel text-sub')}>
          <Lock size={10} className="shrink-0 opacity-60" aria-hidden />
          <span key={url.split('/').slice(0, 5).join('/')} className="demo-rise truncate">
            {url}
          </span>
        </div>
        <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-md', dark ? 'bg-white/10' : 'bg-line')}>
          <img src="/favicon.svg" alt="" width={18} height={18} />
        </span>
      </div>
      <div className="overflow-hidden rounded-b-xl">{children}</div>
      <div className="absolute right-2 top-11 z-10">{popup}</div>
    </div>
  );
}

/** 넓은 데스크톱 화면을 그린 뒤, 들어갈 칸 폭에 맞춰 통째로 줄인다 */
function FitWidth({ width, children }: { width: number; children: ComponentChildren }) {
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0.6);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setS(el.clientWidth / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    // 안쪽을 absolute로 띄워서, 줄이기 전 폭이 바깥 레이아웃을 밀어내지 않게 한다
    <div ref={box} className="relative h-full w-full">
      <div className="absolute left-0 top-0" style={{ width, transform: `scale(${s})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}

/** "드롭스 <보상>을" 처럼 꺾쇠로 감싼 낱말을 노랗게 칠한다 */
const highlight = (s: string) => s.split(/<([^>]+)>/).map((p, i) => (i % 2 ? <span key={i} className="text-[#ffe066]">{p}</span> : p));

/**
 * SOOP 드롭스 보관함. claimed: 앞에서부터 몇 개가 획득 완료인지(코드 추출이 진행되는 만큼 늘어난다).
 * focus: 지금 추출 중인 카드. 주면 그 카드 줄이 보이도록 페이지를 내린다.
 */
export function SoopPage({ c, claimed, focus }: { c: DemoCopy; claimed: number; focus: number | null }) {
  const offset = focus == null ? 0 : 330 + Math.floor(Math.min(focus, N - 1) / 4) * 290;
  return (
    <FitWidth width={880}>
      <div className="bg-white text-[#1c1c1e] transition-transform duration-700 ease-in-out" style={{ transform: `translateY(${-offset}px)` }}>
        <div className="flex h-[62px] items-center px-10">
          <img src={sourceIcons.soop} alt="" className="h-7 w-7 rounded-md" />
          <span className="ml-2 text-[20px] font-extrabold tracking-[-0.02em]">{c.soopName}</span>
          <span className="mx-auto flex h-11 w-[300px] items-center justify-end rounded-full bg-[#f1f2f4] px-4 text-[#8a8d93]">
            <Search size={18} />
          </span>
          <span className="flex items-center gap-5 text-[#3c3f45]">
            <Video size={20} strokeWidth={1.6} />
            <Bell size={20} strokeWidth={1.6} />
            <span className="h-8 w-8 rounded-full bg-[#9aa0a8]" />
            <Grip size={20} />
          </span>
        </div>
        <div className="relative h-[230px] overflow-hidden bg-[#4f84ea] px-10 pt-8 text-white">
          <span className="inline-flex h-7 items-center rounded-full bg-white/25 px-3 text-[13px] font-bold">{c.soopWhat}</span>
          <div className="mt-4 text-[30px] font-bold leading-[1.3] tracking-[-0.02em]">
            {c.soopTitle[0]}
            <br />
            {highlight(c.soopTitle[1])}
          </div>
          <div className="mt-4 space-y-2">
            {[300, 360, 250].map((w) => (
              <div key={w} className="h-2 rounded bg-white/35" style={{ width: w }} />
            ))}
          </div>
          <div className="absolute right-10 top-6 flex gap-4">
            {[1, 4, 3].map((i, k) => (
              <img
                key={i}
                src={rewards[i].img}
                alt=""
                className="h-[150px] w-[150px] rounded-2xl bg-white/15 object-contain p-2 shadow-lg"
                style={{ transform: `rotate(${[-8, 4, -3][k]}deg) translateY(${[10, -6, 18][k]}px)` }}
              />
            ))}
          </div>
        </div>
        <div className="flex h-[56px] items-center gap-6 border-b border-[#eceef1] px-10 text-[15px]">
          <span className="text-[#5f636b]">{c.soopTabs[0]}</span>
          <span className="relative flex h-full items-center font-semibold text-soop">
            {c.soopTabs[1]}
            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-soop" />
          </span>
          <span className="text-[#5f636b]">{c.soopTabs[2]}</span>
          <span className="ml-auto rounded-full border border-[#dfe1e5] px-3 py-1 text-[13px] text-[#5f636b]">{c.soopSettings}</span>
        </div>
        <div className="bg-[#f4f5f7] px-10 pb-10 pt-6">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="rounded-full bg-[#1c1c1e] px-3.5 py-1.5 font-semibold text-white">{c.soopAll}</span>
            <span className="rounded-full border border-[#dfe1e5] bg-white px-3.5 py-1.5">
              {c.soopClaimable} <b className="font-semibold tabular-nums text-soop">{N - claimed}</b>
            </span>
            <span className="rounded-full border border-[#dfe1e5] bg-white px-3.5 py-1.5">
              {c.soopClaimed} <span className="tabular-nums text-[#8a8d93]">{claimed}</span>
            </span>
            <span className="ml-auto text-[12px] text-[#8a8d93]">{c.soopRange}</span>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-5">
            {rewards.map((r, i) => {
              const open = i >= claimed;
              return (
                <div
                  key={r.code}
                  className={cx(
                    'overflow-hidden rounded-lg border bg-white transition-[border-color,box-shadow] duration-300',
                    i === focus && open ? 'border-soop shadow-[0_0_0_3px_rgba(10,108,255,.25)]' : 'border-[#e5e7eb]',
                  )}
                >
                  <div className="relative aspect-[1.24] bg-[#eceef1]">
                    <img src={r.img} alt="" className="h-full w-full object-contain" />
                    {open ? (
                      <div className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-center text-[12px] font-semibold text-white">
                        {c.soopDaysLeft.replace('{days}', String(r.days))}
                      </div>
                    ) : (
                      <div className="demo-fade absolute inset-0 grid place-content-center bg-black/55 text-center text-white">
                        <div className="demo-pop text-[15px] font-bold">{c.soopClaimedOverlay}</div>
                        <div className="mt-1 text-[12px] font-semibold">{c.soopExpires.replace('{date}', r.expires)}</div>
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <div className="text-[12px] text-[#9a9da3]">{r.got}</div>
                    <div className="mt-1 h-[44px] text-[15px] leading-snug">{r.name}</div>
                    <div className={cx('mt-2 grid h-10 place-items-center rounded-md text-[14px]', open ? 'bg-soop font-semibold text-white' : 'bg-[#f1f2f4] text-[#3c3f45]')}>
                      {open ? c.soopClaim : c.soopInfo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FitWidth>
  );
}

const bnBtn = 'grid h-10 w-full place-items-center rounded-[3px] text-[13px] font-semibold transition-all duration-150';
const bnPressed = 'scale-[0.98] bg-bn-blue-hi ring-2 ring-bn-link/60';

/** Battle.net 코드 등록 페이지. 등록 흐름(key-claim → confirm-key-claim / key-lookup)의 화면을 차례로 그린다. */
export function BattlenetPage({ c, state }: { c: DemoCopy; state: BnState }) {
  return (
    <div className="flex h-full min-h-[440px] flex-col bg-bn-bg text-bn-ink">
      <div className="flex h-12 items-center px-5">
        <span className="flex items-center gap-2 text-[13px] font-extrabold tracking-[0.12em] text-bn-ink/90">
          <span className="h-4 w-4 rounded-full border-2 border-bn-link" />
          {c.bnAccount}
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-4">
        {state.kind === 'error' && (
          <div className="demo-rise mb-4 flex w-full max-w-[420px] gap-2 rounded border border-bn-line bg-bn-raise px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="mt-0.5 h-3 w-3 shrink-0 rotate-45 rounded-[2px] bg-bn-red" />
            <div>
              <div>{c.bnUsed}</div>
              <div className="text-bn-sub">{c.bnUsedDesc}</div>
            </div>
          </div>
        )}
        {state.kind === 'loading' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[13px] text-bn-sub">
            <LoaderCircle size={28} className="demo-spin text-bn-link" />
            {c.bnChecking}
          </div>
        ) : state.kind === 'confirm' ? (
          <div className="demo-rise flex w-full max-w-[300px] flex-col items-center">
            <h3 className="text-[22px] font-bold">{c.bnConfirmTitle}</h3>
            <p className="mt-2 text-[12px] text-bn-sub">{c.bnConfirmDesc}</p>
            <div className="mt-5 flex w-full items-center gap-3 rounded border border-bn-line bg-bn-raise p-3">
              <img src={rewards[state.i].img} alt="" className="h-10 w-10 shrink-0 rounded-md bg-bn-field object-cover" />
              <div className="min-w-0 text-left">
                <div className="truncate text-[13px] font-semibold">{rewards[state.i].name}</div>
                <div className="text-[11px] text-bn-sub">{c.bnGame}</div>
              </div>
            </div>
            <span className={cx(bnBtn, 'mt-5 bg-bn-blue text-[#dfe9f7]', state.pressing && bnPressed)}>{c.bnConfirm}</span>
            <span className={cx(bnBtn, 'mt-3 bg-bn-gray')}>{c.bnCancel}</span>
          </div>
        ) : state.kind === 'success' ? (
          <div key={state.i} className="flex flex-1 flex-col items-center justify-center">
            <span className="demo-pop grid h-12 w-12 place-items-center rounded-full bg-[#1a7f4b]">
              <Check size={26} strokeWidth={2.5} />
            </span>
            <h3 className="demo-rise mt-4 text-[20px] font-bold">{c.bnSuccess}</h3>
            <p className="demo-rise mt-2 text-[12px] text-bn-sub">{rewards[state.i].name}</p>
          </div>
        ) : (
          <div className="flex w-full max-w-[300px] flex-col items-center">
            <h3 className="text-[22px] font-bold">{c.bnTitle}</h3>
            <p className="mt-2 text-center text-[12px] text-bn-sub">{c.bnDesc}</p>
            <span className="mt-7 w-full text-left text-[11px] font-semibold">{c.bnLabel}</span>
            <span className="mt-1.5 flex h-10 w-full items-center rounded-[3px] border border-[#6b6e75] bg-bn-field px-2.5 text-[13px] text-bn-faint">{c.bnLabel}</span>
            <span className={cx(bnBtn, 'mt-6 bg-bn-blue text-[#dfe9f7]')}>{c.bnSubmit}</span>
            <span className={cx(bnBtn, 'mt-3 bg-bn-gray')}>{c.bnCancel}</span>
            <span className="mt-4 text-[12px] text-bn-link underline underline-offset-4">{c.bnGuide}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** 등록 흐름 단계별 주소. AGENTS.md의 key-claim → preload → confirm/lookup 흐름을 따른다. */
export function battlenetUrl(state: BnState, lang: string, code: string) {
  const base = `kr.checkout.battle.net/shop/${lang}/checkout/`;
  const masked = code.replace(/-(\w+)-/, '-••••-');
  switch (state.kind) {
    case 'loading':
      return `${base}key-claim?keyCode=${masked}`;
    case 'confirm':
    case 'success':
      return `${base}confirm-key-claim/a2N8MWY0…`;
    case 'error':
      return `${base}key-lookup/a2N8OGQy…`;
    default:
      return `${base}key-claim`;
  }
}
