import { useEffect, useState } from 'react';
import { DAILY_MENU_REVISION_KEY, invalidateDailyMenuReads, readDailyMenuItems } from './dailyMenu.js';
import { SPECIAL_MENU_REVISION_KEY, SPECIAL_MENU_UPDATED, fetchSpecialMenuItems, invalidateSpecialMenuReads } from './specialMenu.js';
import { getCompleteSpecialMenuItems } from '../components/SpecialMenuSection.jsx';
import { getRestaurantDate } from './restaurantDate.js';

export function usePublicMenus(language) {
  const [daily, setDaily] = useState(() => ({ date: getRestaurantDate(), items: [], status: 'loading' }));
  const [special, setSpecial] = useState({ items: [], status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let revision = 0;
    const refresh = async () => {
      const request = ++revision;
      try {
        const items = await fetchSpecialMenuItems(controller.signal);
        if (!controller.signal.aborted && request === revision) {
          setSpecial({ items: getCompleteSpecialMenuItems(items), status: 'ready' });
        }
      } catch {
        if (!controller.signal.aborted && request === revision) setSpecial({ items: [], status: 'error' });
      }
    };
    const forceRefresh = () => { invalidateSpecialMenuReads(); void refresh(); };
    const onStorage = (event) => { if (event.key === SPECIAL_MENU_REVISION_KEY) forceRefresh(); };
    const onVisible = () => { if (!document.hidden) forceRefresh(); };
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    window.addEventListener('focus', forceRefresh);
    window.addEventListener('storage', onStorage);
    window.addEventListener(SPECIAL_MENU_UPDATED, forceRefresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', forceRefresh);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SPECIAL_MENU_UPDATED, forceRefresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (language !== 'cs') return undefined;
    const controller = new AbortController();
    let revision = 0;
    const refresh = async () => {
      const request = ++revision;
      const date = getRestaurantDate();
      setDaily((current) => current.date === date ? current : { date, items: [], status: 'loading' });
      try {
        const items = await readDailyMenuItems(date, { signal: controller.signal });
        if (!controller.signal.aborted && request === revision && date === getRestaurantDate()) {
          setDaily({ date, items, status: 'ready' });
        }
      } catch {
        if (!controller.signal.aborted && request === revision && date === getRestaurantDate()) {
          setDaily({ date, items: [], status: 'error' });
        }
      }
    };
    const forceRefresh = () => { invalidateDailyMenuReads(getRestaurantDate()); void refresh(); };
    const onStorage = (event) => { if (event.key === DAILY_MENU_REVISION_KEY) forceRefresh(); };
    const onVisible = () => { if (!document.hidden) forceRefresh(); };
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 60000);
    window.addEventListener('focus', forceRefresh);
    window.addEventListener('storage', onStorage);
    window.addEventListener('daily-menu-updated', forceRefresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', forceRefresh);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('daily-menu-updated', forceRefresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [language]);

  return { today: daily.date, dailyItems: daily.items, dailyStatus: daily.status, specialItems: special.items, specialStatus: special.status };
}
