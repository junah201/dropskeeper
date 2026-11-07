import { sourceIdFromUrl } from '@/lib/sources/hosts';
import { isBattlenetCheckout, isBattlenetLoginPage } from '@/lib/redeem/battlenet/constants';
import { jobItem, rewardsItem } from '@/lib/storage';
import { useActiveTab, useStored } from './hooks';
import { Home } from './views/Home';
import { SourceView } from './views/SourceView';
import { RedeemView } from './views/RedeemView';

export default function App() {
  const tab = useActiveTab();
  const rewards = useStored(rewardsItem);
  const job = useStored(jobItem);

  if (!tab || rewards === undefined || job === undefined) return null;

  const sourceId = sourceIdFromUrl(tab.url);
  if (sourceId && tab.id != null) return <SourceView sourceId={sourceId} tabId={tab.id} rewards={rewards} job={job} />;

  if ((isBattlenetCheckout(tab.url) || isBattlenetLoginPage(tab.url)) && tab.id != null) {
    return <RedeemView tabId={tab.id} loginPage={isBattlenetLoginPage(tab.url)} rewards={rewards} job={job} />;
  }

  return <Home rewards={rewards} job={job} />;
}
