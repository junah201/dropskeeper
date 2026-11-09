import { sourceIdFromUrl } from '@/lib/sources/hosts';
import { isBattlenetCheckout, isBattlenetLoginPage } from '@/lib/redeem/battlenet/constants';
import { jobItem, rewardsItem, settingsItem } from '@/lib/storage';
import { useMemo, useState } from 'react';
import { defaultSettings, type RewardEntry, type RewardKey } from '@/lib/types';
import { useActiveTab, useStored } from './hooks';
import { PopupCtx, type PopupContext } from './context';
import { Home } from './views/Home';
import { SourceView } from './views/SourceView';
import { RedeemView } from './views/RedeemView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const tab = useActiveTab();
  const stored = useStored(rewardsItem);
  // 사용자가 삭제한 보상은 어느 화면에도 보여 주지 않는다
  const rewards = useMemo(
    () =>
      stored &&
      (Object.fromEntries(Object.entries(stored).filter(([, r]) => !r.dismissed)) as Record<RewardKey, RewardEntry>),
    [stored],
  );
  const job = useStored(jobItem);
  const storedSettings = useStored(settingsItem);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const ctx = useMemo<PopupContext>(
    () => ({
      // 예전 버전에서 저장한 설정에 없는 항목은 기본값으로 채운다
      settings: { ...defaultSettings, ...storedSettings },
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [storedSettings, settingsOpen],
  );

  if (!tab || rewards === undefined || job === undefined || storedSettings === undefined) return null;

  return (
    <PopupCtx.Provider value={ctx}>
      <div className="relative h-full">
        {/* 설정은 위에 덮어 그린다. 아래 화면을 그대로 두어야 닫았을 때 선택한 항목이 남는다. */}
        <div className="h-full" inert={settingsOpen}>
          <MainView tab={tab} rewards={rewards} job={job} />
        </div>
        {settingsOpen && (
          <div className="absolute inset-0 z-20 bg-bg">
            <SettingsView />
          </div>
        )}
      </div>
    </PopupCtx.Provider>
  );
}

function MainView({
  tab,
  rewards,
  job,
}: {
  tab: NonNullable<ReturnType<typeof useActiveTab>>;
  rewards: Record<RewardKey, RewardEntry>;
  job: Parameters<typeof Home>[0]['job'];
}) {
  const sourceId = sourceIdFromUrl(tab.url);
  if (sourceId && tab.id != null) return <SourceView sourceId={sourceId} tabId={tab.id} rewards={rewards} job={job} />;

  if ((isBattlenetCheckout(tab.url) || isBattlenetLoginPage(tab.url)) && tab.id != null) {
    return <RedeemView tabId={tab.id} loginPage={isBattlenetLoginPage(tab.url)} rewards={rewards} job={job} />;
  }

  return <Home rewards={rewards} job={job} />;
}
