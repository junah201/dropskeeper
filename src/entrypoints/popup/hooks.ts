import { useEffect, useState } from 'react';
import type { WxtStorageItem } from '#imports';

/** storage 항목을 읽고 바뀔 때마다 다시 그린다. 처음 읽기 전에는 undefined. */
export function useStored<T>(item: WxtStorageItem<T, {}>): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let alive = true;
    item.getValue().then((v) => alive && setValue(v));
    const unwatch = item.watch((v) => setValue(v));
    return () => {
      alive = false;
      unwatch();
    };
  }, [item]);
  return value;
}

export interface ActiveTab {
  id?: number;
  url?: string;
}

/** 팝업을 연 탭. 팝업이 떠 있는 동안 그 탭의 주소가 바뀌면 따라 바뀐다. */
export function useActiveTab(): ActiveTab | undefined {
  const [tab, setTab] = useState<ActiveTab>();
  useEffect(() => {
    let tabId: number | undefined;
    browser.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
      tabId = t?.id;
      setTab({ id: t?.id, url: t?.url });
    });
    // host_permissions에 있는 사이트로 이동할 때만 changeInfo.url이 채워진다. 팝업 화면을 고를 때 필요한 것도 그 사이트뿐이다.
    const onUpdated = (id: number, info: { url?: string }) => {
      if (id === tabId && info.url) setTab({ id, url: info.url });
    };
    browser.tabs.onUpdated.addListener(onUpdated);
    return () => browser.tabs.onUpdated.removeListener(onUpdated);
  }, []);
  return tab;
}

/** 1초마다 다시 그려 남은 시간 같은 값을 갱신한다 */
export function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [active]);
  return now;
}
