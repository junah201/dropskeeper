import { handleMessages, isBnetMessage, sendToBackground } from '@/lib/messages';
import { clickConfirm, describePage, inspectPage } from '@/lib/redeem/battlenet/page';
import { BATTLENET_CHECKOUT_MATCHES, isKeyClaimPage, isSupportedBattlenetPage } from '@/lib/redeem/battlenet/constants';
import { i18n } from '#i18n';
import { PageCard } from '@/lib/pageCard';
import { pendingRewards } from '@/lib/pending';
import { jobItem, rewardsItem, settingsItem } from '@/lib/storage';
import { defaultSettings } from '@/lib/types';
import { tx } from '@/lib/i18n';

export default defineContentScript({
  matches: BATTLENET_CHECKOUT_MATCHES,
  main() {
    showCard();

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

/**
 * 코드 없이 연 등록 페이지(사용자가 직접 연 페이지)에서만 안내 카드를 띄운다. 설정에서 끌 수 있다.
 * 등록 작업은 `key-claim?keyCode=`로 코드를 넣어 열고, 작업 중에는 안내를 숨긴다.
 * 저장소는 읽기만 하고, 등록 시작은 background에 요청한다.
 */
function showCard() {
  const url = location.href;
  if (!isKeyClaimPage(url) || !isSupportedBattlenetPage(url) || new URL(url).searchParams.has('keyCode')) return;

  const card = new PageCard();
  const refresh = async () => {
    const [rewards, job, settings] = await Promise.all([rewardsItem.getValue(), jobItem.getValue(), settingsItem.getValue()]);
    const busy = job?.kind === 'redeem' && (job.status === 'running' || job.status === 'paused');
    const n = busy || !{ ...defaultSettings, ...settings }.pageHints ? 0 : pendingRewards(rewards).length;
    card.show(
      n === 0
        ? null
        : {
            title: i18n.t('card.redeemFound', n),
            description: i18n.t('card.redeemDescription'),
            action: {
              label: i18n.t('card.redeemStart'),
              busyLabel: i18n.t('card.starting'),
              run: async () => {
                const res = await sendToBackground({ type: 'job/redeemPending' });
                return res.ok ? undefined : tx(res.error);
              },
            },
          },
    );
  };
  void refresh();
  rewardsItem.watch(() => void refresh());
  jobItem.watch(() => void refresh());
  settingsItem.watch(() => void refresh());
}
