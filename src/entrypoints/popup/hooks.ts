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

export function useActiveTab(): ActiveTab | undefined {
  const [tab, setTab] = useState<ActiveTab>();
  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then(([t]) => setTab({ id: t?.id, url: t?.url }));
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
