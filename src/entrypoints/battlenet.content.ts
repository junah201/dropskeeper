import { handleMessages, isBnetMessage } from '@/lib/messages';
import { clickConfirm, inspectPage } from '@/lib/redeem/battlenet/page';

export default defineContentScript({
  matches: ['https://kr.checkout.battle.net/*'],
  main() {
    handleMessages(isBnetMessage, async (msg) => {
      switch (msg.type) {
        case 'bnet/inspect':
          return inspectPage();
        case 'bnet/confirm':
          return { clicked: clickConfirm() };
      }
    });
  },
});
