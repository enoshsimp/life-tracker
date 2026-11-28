import { useEffect, useState } from 'react';
import { getNow } from './day';

/** Re-reads the clock every 30 seconds and when the app comes back into view, so the day rolls over at the reset hour. */
export function useNow() {
  const [now, setNow] = useState(getNow);
  useEffect(() => {
    const refresh = () => setNow(getNow());
    const id = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return now;
}
