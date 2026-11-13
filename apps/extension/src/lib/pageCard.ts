/**
 * 드롭스 인벤토리와 Battle.net 코드 등록 페이지 오른쪽 위에 띄우는 안내 카드.
 *
 * 위쪽 화살표로 툴바의 확장 아이콘 쪽을 가리킨다. 페이지 안에서는 툴바까지 그릴 수 없어 대략 그쪽을 가리킬 뿐이다.
 * "DropsKeeper 열기"는 진짜 확장 팝업을 아이콘 아래에 연다(chrome.action.openPopup).
 *
 * 처음 쓰는 사람이 "확장 아이콘을 다시 눌러야 한다"는 걸 모르고 멈추는 일이 많아,
 * 다음에 할 일(추출하기, 등록하러 가기, 등록하기)을 페이지 안에서 바로 누를 수 있게 한다.
 * 페이지 스타일과 섞이지 않도록 shadow DOM 안에 그린다. Battle.net 화면 판독(page.ts)은 body의 textContent만 읽으므로
 * shadow DOM 안 문구는 판독에 끼어들지 않는다.
 */
import { i18n } from '#i18n';
import { sendToBackground } from './messages';
import { msg, tx } from './i18n';

export interface CardAction {
  label: string;
  /** 누르는 동안 버튼에 보일 문구. 없으면 버튼을 잠그지 않는다. */
  busyLabel?: string;
  /** 실패하면 카드에 보여 줄 문구를 돌려준다 */
  run: () => Promise<string | undefined> | void;
}

export interface CardState {
  title: string;
  description?: string;
  /** 진행 막대 (0~1) */
  progress?: number;
  action?: CardAction;
}

const LOGO =
  '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#151a23"/><path fill="#fff" d="M6.1 8h19.8a2.6 2.6 0 0 1 2.6 2.6v2.6a2.8 2.8 0 0 0 0 5.6v2.6a2.6 2.6 0 0 1-2.6 2.6H6.1a2.6 2.6 0 0 1-2.6-2.6v-2.6a2.8 2.8 0 0 0 0-5.6v-2.6A2.6 2.6 0 0 1 6.1 8Z"/><path fill="#2350d8" d="M14.7 10.6h2.6v5.6h3.4L16 21.4l-4.7-5.2h3.4Z"/></svg>';

// 팝업 theme.css와 같은 색을 쓴다
const STYLE = `
:host { all: initial; }
.card {
  position: fixed; top: 12px; right: 16px; z-index: 2147483647;
  width: 320px; max-width: calc(100vw - 32px); box-sizing: border-box;
  padding: 16px; border: 1px solid #e1e4ea; border-radius: 12px;
  background: #fff; color: #151a23; box-shadow: 0 8px 28px rgba(21, 26, 35, 0.22);
  word-break: keep-all; overflow-wrap: anywhere;
  font: 14px/1.5 'Pretendard Variable', Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif;
  animation: in 0.2s ease-out;
}
@keyframes in { from { opacity: 0; transform: translateY(-8px); } }
/* 툴바의 확장 아이콘 쪽을 가리키는 화살표 */
.card::before {
  content: ''; position: absolute; top: -7px; right: 20px; width: 12px; height: 12px;
  background: #fff; border-top: 1px solid #e1e4ea; border-left: 1px solid #e1e4ea; transform: rotate(45deg);
}
@media (prefers-reduced-motion: reduce) { .card, .bar i { animation: none; transition: none; } }
.head { display: flex; gap: 10px; align-items: flex-start; }
.head svg { flex-shrink: 0; }
.head > div { flex: 1; min-width: 0; }
.title { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.4; }
.desc { margin: 2px 0 0; font-size: 13px; color: #5d6676; }
.desc:empty { display: none; }
.close {
  margin: -4px -4px 0 auto; flex-shrink: 0; width: 24px; height: 24px; padding: 0;
  border: 0; border-radius: 6px; background: none; color: #8b93a1; font-size: 18px; line-height: 24px; cursor: pointer;
}
.close:hover { background: #f6f7f9; color: #151a23; }
.bar { height: 4px; margin-top: 12px; border-radius: 2px; background: #e1e4ea; overflow: hidden; }
.bar[hidden] { display: none; }
.bar i { display: block; height: 100%; background: #2350d8; transition: width 0.3s; }
/* 주 버튼은 가로를 채우고, "DropsKeeper 열기"는 그 아래 글자 버튼으로 둔다. 문구가 길어도 넘치지 않는다. */
.buttons { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.buttons button { border-radius: 8px; font: inherit; cursor: pointer; }
.buttons [hidden] { display: none; }
.action { height: 38px; padding: 0 12px; border: 1px solid #2350d8; background: #2350d8; color: #fff; font-weight: 600; }
.details { height: 30px; padding: 0 8px; border: 0; background: none; color: #5d6676; font-size: 13px; font-weight: 500; }
.details:hover { background: #f6f7f9; color: #151a23; }
.action:hover { background: #1c43b8; }
.action:disabled { border-color: #b9c0cc; background: #b9c0cc; cursor: default; }
.error { margin: 10px 0 0; padding: 8px 10px; border-radius: 8px; background: #fbe9e7; color: #c2362b; font-size: 13px; }
.error:empty { display: none; }
button:focus-visible { outline: 2px solid #2350d8; outline-offset: 2px; }
`;

export class PageCard {
  private host?: HTMLElement;
  private els?: { title: HTMLElement; desc: HTMLElement; bar: HTMLElement; fill: HTMLElement; action: HTMLButtonElement; error: HTMLElement };
  private closed = false;
  private busy = false;
  private state: CardState | null = null;
  /** 브라우저가 팝업 열기를 지원하지 않으면 "DropsKeeper 열기"를 숨긴다 */
  private noPopup = false;

  /** null이면 숨긴다. 사용자가 닫았으면 이 페이지에서는 다시 띄우지 않는다. */
  show(state: CardState | null) {
    // 화면이 바뀌면(다른 단계로 넘어가면) 이전 오류는 지운다
    if (state?.title !== this.state?.title) this.els && (this.els.error.textContent = '');
    this.state = state;
    if (!state || this.closed) return this.remove();
    if (!this.els) this.mount();
    const e = this.els!;
    e.title.textContent = state.title;
    e.desc.textContent = state.description ?? '';
    e.bar.hidden = state.progress == null;
    e.fill.style.width = `${Math.round((state.progress ?? 0) * 100)}%`;
    e.action.hidden = !state.action;
    if (state.action && !this.busy) {
      e.action.disabled = false;
      e.action.textContent = state.action.label;
    }
  }

  /** 페이지 주소가 바뀌어 다른 화면이 되면 닫음 상태를 풀어 준다 */
  reset() {
    this.closed = false;
    this.show(null);
  }

  private remove() {
    this.host?.remove();
    this.host = undefined;
    this.els = undefined;
  }

  private mount() {
    const host = document.createElement('dropskeeper-card');
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>${STYLE}</style>
<section class="card" role="region" aria-label="DropsKeeper">
  <div class="head">
    ${LOGO}
    <div>
      <p class="title" aria-live="polite"></p>
      <p class="desc"></p>
    </div>
    <button class="close" type="button">×</button>
  </div>
  <div class="bar" hidden><i></i></div>
  <div class="buttons">
    <button class="action" type="button" hidden></button>
    <button class="details" type="button"></button>
  </div>
  <p class="error" role="alert"></p>
</section>`;
    const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    const close = $<HTMLButtonElement>('.close');
    close.title = close.ariaLabel = i18n.t('card.close');
    close.onclick = () => {
      this.closed = true;
      this.remove();
    };
    const action = $<HTMLButtonElement>('.action');
    const error = $('.error');
    action.onclick = async () => {
      const a = this.state?.action;
      if (!a) return;
      error.textContent = '';
      if (a.busyLabel) {
        this.busy = true;
        action.disabled = true;
        action.textContent = a.busyLabel;
      }
      const err = await Promise.resolve(a.run()).catch((e: unknown) => String(e));
      this.busy = false;
      if (err) error.textContent = err;
      // 성공하면 대개 작업 상태가 바뀌어 다른 화면으로 넘어간다. 그대로면 버튼을 되돌린다.
      if (this.state) this.show(this.state);
    };
    const details = $<HTMLButtonElement>('.details');
    details.textContent = i18n.t('card.details');
    details.hidden = this.noPopup;
    details.onclick = async () => {
      error.textContent = '';
      const res = await sendToBackground({ type: 'ui/openPopup' }).catch(() => undefined);
      if (res?.ok) return;
      this.noPopup = true;
      details.hidden = true;
      error.textContent = tx(res ? res.error : msg('msg.popupOpenFailed'));
    };
    this.els = { title: $('.title'), desc: $('.desc'), bar: $('.bar'), fill: $('.bar i'), action, error };
    this.host = host;
    document.documentElement.append(host);
  }
}
