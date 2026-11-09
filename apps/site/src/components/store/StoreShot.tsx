// Chrome 웹 스토어 스크린샷 한 장(1280×800). 소개 페이지 동작 데모의 장면 하나를 멈춰 놓고 머리글을 단다.
// 크기가 모두 정해져 있어 서버에서만 그린다(client: 지시어 없음).
import type { Copy, Lang } from '../../i18n';
import type { PopupText } from '../../popupText';
import { N, rewards } from '../demo/data';
import { DemoPopup } from '../demo/DemoPopup';
import { BattlenetPage, BrowserFrame, SoopPage, battlenetUrl } from '../demo/Pages';
import { makeT } from '../demo/text';
import type { Frame } from '../demo/timeline';

/** 스크린샷 차례대로의 장면. 화면 구성은 StepDemo와 같다. */
const shots: { which: 'extract' | 'redeem'; frame: Frame }[] = [
  { which: 'extract', frame: { scene: { kind: 'list', checked: N }, bn: { kind: 'form' }, cur: 0 } },
  { which: 'extract', frame: { scene: { kind: 'extracting', done: 3 }, bn: { kind: 'form' }, cur: 0 } },
  { which: 'redeem', frame: { scene: { kind: 'redeeming', done: 2 }, bn: { kind: 'confirm', i: 2 }, cur: 2 } },
  { which: 'redeem', frame: { scene: { kind: 'result' }, bn: { kind: 'success', i: N - 1 }, cur: N - 1 } },
];

export const SHOT_COUNT = shots.length;

const SCALE = 0.92;
/** 브라우저 창 안쪽 폭(1280 - 양옆 여백 64·2 - 테두리 2) */
const PAGE_WIDTH = 1150;

export default function StoreShot({ n, lang, popup, c }: { n: number; lang: Lang; popup: PopupText; c: Copy }) {
  const { which, frame: f } = shots[n];
  const { title, desc } = c.storeShots[n];
  const t = makeT(popup);
  const redeem = which === 'redeem';
  // 추출 중에는 StepDemo처럼 추출을 마친 카드가 획득 완료로 바뀌고, 지금 추출하는 카드가 보이게 페이지를 내린다.
  const extracting = f.scene.kind === 'extracting' ? f.scene.done : null;

  return (
    <div className="h-[800px] w-[1280px] overflow-hidden bg-bg font-sans text-ink">
      <div className="px-16 pt-12">
        <h1 className="text-[40px] font-extrabold leading-tight tracking-[-0.02em]">{title}</h1>
        <p className="mt-3 text-[20px] text-sub">{desc}</p>
      </div>
      {/* 창 아래쪽은 화면 밖으로 잘라 낸다 */}
      <div className="mx-16 mt-10">
        <BrowserFrame
          dark={redeem}
          url={redeem ? battlenetUrl(f.bn, lang, rewards[f.cur].code) : 'drops.sooplive.com/inventory'}
          popup={
            <div style={{ width: 400 * SCALE, height: 580 * SCALE }}>
              <div
                className="h-[580px] w-[400px] overflow-hidden rounded-xl border border-line bg-bg font-sans text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,.55),0_2px_6px_rgba(0,0,0,.12)]"
                style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
              >
                <DemoPopup scene={f.scene} t={t} />
              </div>
            </div>
          }
        >
          <div className={`h-[620px] overflow-hidden ${redeem ? 'bg-bn-bg' : 'bg-white'}`} style={{ paddingRight: redeem ? 400 * SCALE - 16 : 0 }}>
            {redeem ? <BattlenetPage c={c.demo} state={f.bn} /> : <SoopPage c={c.demo} claimed={extracting ?? 0} focus={extracting} scale={PAGE_WIDTH / 880} />}
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}
