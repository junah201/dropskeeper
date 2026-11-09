// 소개 페이지의 단계별 동작 데모. 사이트에서 유일하게 브라우저에서 도는 React 섬이다(client:visible).
// 빌드 때도 첫 장면을 HTML로 그려 두므로, JS가 꺼져 있어도 세부 순서와 화면은 보인다.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Copy, Lang, Stage } from '../../i18n';
import type { PopupText } from '../../popupText';
import { rewards } from './data';
import { DemoPopup } from './DemoPopup';
import { BattlenetPage, BrowserFrame, SoopPage, battlenetUrl } from './Pages';
import { makeT } from './text';
import { extractLine, redeemLine, type Timeline } from './timeline';

interface Props {
  which: 'extract' | 'redeem';
  kicker: string;
  title: string;
  desc: string;
  lang: Lang;
  stages: Stage[];
  /** 확장 팝업 문구 (확장 locales에서 빌드 때 골라 온 것) */
  popup: PopupText;
  /** 팝업 뒤 사이트 화면 문구 */
  pages: Copy['demo'];
}

const lines: Record<Props['which'], Timeline> = { extract: extractLine, redeem: redeemLine };

/** 화면에 보일 때만 도는 시계. 움직임 줄이기 설정이면 frozen 시점에 멈춘다. */
function usePlayer(line: Timeline) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener('change', on);
    const el = ref.current;
    const io = el && new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    if (el && io) io.observe(el);
    return () => {
      m.removeEventListener('change', on);
      io?.disconnect();
    };
  }, []);
  useEffect(() => {
    if (reduced) {
      setT(line.frozen);
      return;
    }
    if (!visible) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      setT((p) => (p + now - last) % line.total);
      last = now;
    }, 50);
    return () => window.clearInterval(id);
  }, [visible, reduced, line]);
  return { ref, t, jump: (stage: number) => setT(line.stageStart[stage]) };
}

/** 팝업 크기. 창 폭에 맞춰 줄인다. */
function usePopupScale() {
  const [scale, setScale] = useState(0.78);
  useEffect(() => {
    const on = () => setScale(window.innerWidth >= 1100 ? 0.78 : window.innerWidth >= 640 ? 0.7 : 0.55);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return scale;
}

export default function StepDemo({ which, kicker, title, desc, lang, stages, popup, pages }: Props) {
  const line = lines[which];
  const { ref, t: now, jump } = usePlayer(line);
  const f = line.frame(now);
  const t = useMemo(() => makeT(popup), [popup]);
  const scale = usePopupScale();
  // 화면이 바뀌어도 창 높이가 흔들리지 않게 고정한다
  const height = Math.max(480, 580 * scale + 24);
  const extracting = f.scene.kind === 'extracting' ? f.scene.done : f.scene.kind === 'extractDone' ? rewards.length : null;

  return (
    // 설명과 화면을 좌우로 둔다. 2단계는 화면을 왼쪽에 두어 지그재그로 읽힌다.
    <div ref={ref} className={`grid grid-cols-1 items-center gap-10 lg:gap-14 ${which === 'redeem' ? 'lg:grid-cols-[1.35fr_1fr]' : 'lg:grid-cols-[1fr_1.35fr]'}`}>
      <div>
      <span className="font-mono text-[12px] font-medium text-accent">{kicker}</span>
      <h2 className="mt-2 text-balance text-[30px] font-bold tracking-[-0.01em]">{title}</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-sub">{desc}</p>
      <ol className="mt-6 max-w-md space-y-1">
        {stages.map((s, i) => {
          const on = i === f.stage;
          return (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={on ? 'step' : undefined}
                className={`flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${on ? 'bg-panel shadow-sm ring-1 ring-line' : 'hover:bg-panel/70'}`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[11px] transition-colors ${
                    i < f.stage ? 'bg-accent-soft text-accent' : on ? 'bg-accent text-white' : 'bg-mute-soft text-faint'
                  }`}
                >
                  {i < f.stage ? '✓' : i + 1}
                </span>
                <span>
                  <span className={`block text-[14px] font-semibold ${on ? 'text-ink' : 'text-sub'}`}>{s.label}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-faint">{s.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      </div>

      {/* 데모 화면은 그림이라 눌러도 아무 일이 없다. 화면 낭독기와 키보드 이동에서도 뺀다. */}
      <div className={`min-w-0 ${which === 'redeem' ? 'lg:order-first' : ''}`} inert aria-hidden>
        <BrowserFrame
          dark={which === 'redeem'}
          url={which === 'extract' ? 'drops.sooplive.com/inventory' : battlenetUrl(f.bn, lang, rewards[f.cur].code)}
          popup={
            <div style={{ width: 400 * scale, height: 580 * scale }}>
              <div
                className="h-[580px] w-[400px] overflow-hidden rounded-xl border border-line bg-bg font-sans text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,.55),0_2px_6px_rgba(0,0,0,.12)]"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                <DemoPopup scene={f.scene} t={t} />
              </div>
            </div>
          }
        >
          {/* 등록 페이지는 가운데 정렬이라, 팝업에 가리지 않게 팝업 폭만큼 왼쪽으로 민다 */}
          <div
            className={`overflow-hidden ${which === 'redeem' ? 'bg-bn-bg' : 'bg-white'}`}
            style={{ height, paddingRight: which === 'redeem' && scale >= 0.6 ? 400 * scale - 16 : 0 }}
          >
            {which === 'extract' ? <SoopPage c={pages} claimed={extracting ?? 0} focus={extracting} /> : <BattlenetPage c={pages} state={f.bn} />}
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}
