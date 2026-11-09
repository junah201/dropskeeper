import { handleMessages, isBnetMessage } from '@/lib/messages';
import { clickConfirm, describePage, inspectPage } from '@/lib/redeem/battlenet/page';
import { BATTLENET_CHECKOUT_MATCHES } from '@/lib/redeem/battlenet/constants';

export default defineContentScript({
  matches: BATTLENET_CHECKOUT_MATCHES,
  main() {
    let lastLog = '';
    handleMessages(isBnetMessage, async (msg) => {
      switch (msg.type) {
        case 'bnet/inspect': {
          const state = inspectPage();
          // 원인 파악용 로그. 같은 상태는 한 번만 남긴다 (Battle.net 탭의 개발자 도구 콘솔).
          const key = JSON.stringify(state);
          if (key !== lastLog) {
            lastLog = key;
            console.info('[DropsKeeper] 화면 상태', state, describePage());
          }
          return state;
        }
        case 'bnet/confirm': {
          const clicked = clickConfirm();
          console.info('[DropsKeeper] 확인 버튼', clicked ? '누름' : '찾지 못함');
          return { clicked };
        }
      }
    });
  },
});
