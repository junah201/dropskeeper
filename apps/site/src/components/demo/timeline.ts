// 두 단계(코드 추출, 등록)의 장면 시계. 시각(ms)을 넣으면 그때 팝업과 뒤 페이지가 어떤 화면인지 돌려준다.
import { FAIL_AT, N } from './data';

/** 팝업 화면. 이름은 확장의 views(SourceView, RedeemView) 화면과 맞춘다. */
export type Scene =
  | { kind: 'intro'; pressing?: boolean }
  | { kind: 'loading' }
  | { kind: 'list'; checked: number; pressing?: boolean }
  | { kind: 'extracting'; done: number }
  | { kind: 'extractDone' }
  | { kind: 'queue'; pressing?: boolean }
  | { kind: 'redeeming'; done: number }
  | { kind: 'result' };

/** Battle.net 등록 페이지 화면 */
export type BnState =
  | { kind: 'form' }
  | { kind: 'loading' }
  | { kind: 'confirm'; i: number; pressing?: boolean }
  | { kind: 'success'; i: number }
  | { kind: 'error' };

export interface Frame {
  scene: Scene;
  bn: BnState;
  /** 지금 다루는 보상 */
  cur: number;
}

interface Def {
  stage: number;
  ms: number;
  at: (l: number, ms: number) => Frame;
  /** 구간 안에서 화면이 바뀌는 시각(구간 시작 기준). 이 시각부터 새 화면이다. */
  cuts?: (ms: number) => number[];
}

export interface Timeline {
  total: number;
  /** 세부 순서마다 시작 시각. 목록을 누르면 여기로 건너뛴다. */
  stageStart: number[];
  /** 움직임 줄이기 설정일 때 멈춰 둘 시각 */
  frozen: number;
  frame: (t: number) => Frame & { stage: number };
  /** t 다음에 화면이 바뀌는 시각. 끝까지 바뀌지 않으면 total */
  next: (t: number) => number;
}

function make(defs: Def[], frozen: number): Timeline {
  const starts: number[] = [];
  defs.forEach((d, i) => starts.push(i ? starts[i - 1] + defs[i - 1].ms : 0));
  const total = starts[starts.length - 1] + defs[defs.length - 1].ms;
  const stages = Math.max(...defs.map((d) => d.stage)) + 1;
  const stageStart = Array.from({ length: stages }, (_, s) => starts[defs.findIndex((d) => d.stage === s)]);
  const marks = [
    ...new Set(defs.flatMap((d, i) => [starts[i], ...(d.cuts?.(d.ms) ?? []).filter((c) => c > 0 && c < d.ms).map((c) => starts[i] + c)])),
  ].sort((a, b) => a - b);
  return {
    total,
    stageStart,
    frozen,
    frame(t) {
      let i = defs.length - 1;
      while (starts[i] > t) i--;
      return { ...defs[i].at(t - starts[i], defs[i].ms), stage: defs[i].stage };
    },
    next: (t) => marks.find((m) => m > t) ?? total,
  };
}

const form: BnState = { kind: 'form' };
const PRESS = 450;
/** 1..n 번째 step 시각 */
const steps = (n: number, step: number) => Array.from({ length: n }, (_, k) => (k + 1) * step);

/** 1단계: 드롭스 인벤토리에서 보상을 불러와 고르고 코드를 추출한다 */
export const extractLine = make(
  [
    { stage: 0, ms: 1300, at: (l, ms) => ({ scene: { kind: 'intro', pressing: l >= ms - PRESS }, bn: form, cur: 0 }), cuts: (ms) => [ms - PRESS] },
    { stage: 0, ms: 700, at: () => ({ scene: { kind: 'loading' }, bn: form, cur: 0 }) },
    {
      stage: 1,
      ms: N * 260 + 700,
      at: (l, ms) => ({ scene: { kind: 'list', checked: Math.min(N, Math.floor(l / 260)), pressing: l >= ms - PRESS }, bn: form, cur: 0 }),
      cuts: (ms) => [...steps(N, 260), ms - PRESS],
    },
    {
      stage: 2,
      ms: N * 380 + 400,
      at: (l) => ({ scene: { kind: 'extracting', done: Math.min(N, Math.floor(l / 380)) }, bn: form, cur: 0 }),
      cuts: () => steps(N, 380),
    },
    { stage: 2, ms: 2200, at: () => ({ scene: { kind: 'extractDone' }, bn: form, cur: 0 }) },
  ],
  2000 + N * 260 + 700 + 4 * 380,
);

const PER = 1100;
/** 2단계: Battle.net 등록 페이지에서 등록하기를 누르면 차례로 등록한다 */
export const redeemLine = make(
  [
    { stage: 0, ms: 1500, at: (l, ms) => ({ scene: { kind: 'queue', pressing: l >= ms - PRESS }, bn: form, cur: 0 }), cuts: (ms) => [ms - PRESS] },
    {
      stage: 1,
      ms: N * PER,
      at: (l) => {
        const i = Math.floor(l / PER);
        const p = l % PER;
        if (p < 350) return { scene: { kind: 'redeeming', done: i }, bn: { kind: 'loading' }, cur: i };
        if (i === FAIL_AT) return { scene: { kind: 'redeeming', done: p >= 650 ? i + 1 : i }, bn: { kind: 'error' }, cur: i };
        if (p < 800) return { scene: { kind: 'redeeming', done: i }, bn: { kind: 'confirm', i, pressing: p >= 620 }, cur: i };
        return { scene: { kind: 'redeeming', done: i + 1 }, bn: { kind: 'success', i }, cur: i };
      },
      cuts: () => [0, ...steps(N - 1, PER)].flatMap((s) => [s, s + 350, s + 620, s + 650, s + 800]),
    },
    { stage: 2, ms: 2800, at: () => ({ scene: { kind: 'result' }, bn: { kind: 'success', i: N - 1 }, cur: N - 1 }) },
  ],
  1500 + 4.5 * PER,
);
