import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData } from './types';
import type { Fx } from '../components/Celebrations';
import { areaLevel, areaXp, overallLevel, totalXp } from './game';
import { newlyEarned } from './achievements';
import { appDayDate, getNow } from './day';
import { newId } from './id';

interface Snapshot {
  amounts: Map<string, number>;
  level: number;
  areaLevels: Record<string, number>;
}

function snapshot(data: AppData): Snapshot {
  const xp = areaXp(data);
  return {
    amounts: new Map(data.ledger.map((e) => [e.id, e.amount])),
    level: overallLevel(totalXp(data)).level,
    areaLevels: Object.fromEntries(data.settings.areas.map((a) => [a.id, areaLevel(xp[a.id] ?? 0).level])),
  };
}

/**
 * Watches the data for things worth celebrating (points earned, level-ups,
 * life-area level-ups, new badges) and queues the animations. Also records
 * newly earned badges. Whatever is already true when the app opens is
 * recorded quietly, without animations.
 */
export function useGameEvents(data: AppData, update: (fn: (d: AppData) => AppData) => void) {
  const [queue, setQueue] = useState<Fx[]>([]);
  const prev = useRef<Snapshot | null>(null);

  useEffect(() => {
    if (!data.setupDone) return;
    const fx: Fx[] = [];
    const before = prev.current;
    const now = snapshot(data);

    if (before) {
      // Points: anything new or increased since the last change.
      for (const e of data.ledger) {
        const gained = e.amount - (before.amounts.get(e.id) ?? 0);
        if (gained > 0) fx.push({ id: newId(), type: 'points', amount: gained, bonus: e.bonus, weekly: e.kind === 'weekly' });
      }
      for (const a of data.settings.areas) {
        if (now.areaLevels[a.id] > (before.areaLevels[a.id] ?? 1)) {
          fx.push({ id: newId(), type: 'area', name: a.name.trim() || 'Life area', level: now.areaLevels[a.id] });
        }
      }
      if (now.level > before.level) fx.push({ id: newId(), type: 'level', level: now.level });
    }

    const badges = newlyEarned(data, appDayDate(getNow(), data.settings.dayStartHour));
    if (badges.length) {
      const at = new Date().toISOString();
      update((d) => ({ ...d, achievements: { ...d.achievements, ...Object.fromEntries(badges.map((b) => [b.id, at])) } }));
      if (before) for (const b of badges) fx.push({ id: newId(), type: 'badge', name: b.name, description: b.description });
    }

    prev.current = now;
    if (fx.length) setQueue((q) => [...q, ...fx]);
  }, [data, update]);

  const done = useCallback((id: string) => setQueue((q) => q.filter((f) => f.id !== id)), []);
  return [queue, done] as const;
}
