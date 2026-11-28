import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData, LedgerKind } from './types';
import type { Fx } from '../components/Celebrations';
import { areaLevel, areaXp, overallLevel, totalXp } from './game';
import { newlyEarned } from './achievements';
import { excessOn } from './bosses';
import { appDayDate, appDayKey, getNow } from './day';
import { newId } from './id';

interface Snapshot {
  amounts: Map<string, number>;
  level: number;
  areaLevels: Record<string, number>;
  /** Bad habit id → today's slips past the limit (each one heals its boss). */
  excess: Record<string, number>;
}

function snapshot(data: AppData): Snapshot {
  const xp = areaXp(data);
  const todayKey = appDayKey(getNow(), data.settings.dayStartHour);
  return {
    amounts: new Map(data.ledger.map((e) => [e.id, e.amount])),
    level: overallLevel(totalXp(data)).level,
    areaLevels: Object.fromEntries(data.settings.areas.map((a) => [a.id, areaLevel(xp[a.id] ?? 0).level])),
    excess: Object.fromEntries(data.settings.badHabits.map((h) => [h.id, excessOn(data, h, todayKey)])),
  };
}

/** A short note on a points pill for the kinds that aren't plain ticks. */
const NOTES: Partial<Record<LedgerKind, string>> = {
  weekly: 'Weekly target hit!',
  resisted: 'Urge resisted',
  comeback: 'Comeback!',
  boss: 'Boss defeated!',
};

/**
 * Watches the data for things worth celebrating (points earned, level-ups,
 * life-area level-ups, new badges) and queues the animations. Also records
 * newly earned badges. Whatever is already true when the app opens is
 * recorded quietly, without animations.
 */
export function useGameEvents(data: AppData, update: (fn: (d: AppData) => AppData) => void, epoch = 0) {
  const [queue, setQueue] = useState<Fx[]>([]);
  const prev = useRef<Snapshot | null>(null);
  const prevEpoch = useRef(epoch);

  useEffect(() => {
    if (!data.setupDone) return;
    const fx: Fx[] = [];
    // When the whole data set is swapped (a restored backup), start over quietly.
    if (epoch !== prevEpoch.current) {
      prevEpoch.current = epoch;
      prev.current = null;
    }
    const before = prev.current;
    const now = snapshot(data);

    if (before) {
      // Points: anything new or increased since the last change.
      // Clean days are shown as one "boss hit" pill per boss (with their XP), not a pill per day.
      const hits = new Map<string, { damage: number; xp: number }>();
      const defeats: { habitId: string; round: number }[] = [];
      for (const e of data.ledger) {
        const isNew = !before.amounts.has(e.id);
        const gained = e.amount - (before.amounts.get(e.id) ?? 0);
        if (isNew && e.kind === 'clean') {
          const h = hits.get(e.ref) ?? { damage: 0, xp: 0 };
          hits.set(e.ref, { damage: h.damage + 1, xp: h.xp + e.amount });
          continue;
        }
        if (gained > 0) fx.push({ id: newId(), type: 'points', amount: gained, bonus: e.bonus, note: NOTES[e.kind] });
        if (isNew && e.kind === 'boss') {
          const [habitId, round] = e.ref.split('#');
          defeats.push({ habitId, round: Number(round) });
        }
      }
      // Bosses: one pill per boss for the damage from finished clean days, one for heals from new slips.
      const bossName = (id: string) => data.settings.badHabits.find((h) => h.id === id)?.name.trim() || 'Boss';
      for (const [habitId, h] of hits) fx.push({ id: newId(), type: 'boss-hit', name: bossName(habitId), damage: h.damage, xp: h.xp });
      for (const h of data.settings.badHabits) {
        const more = now.excess[h.id] - (before.excess[h.id] ?? 0);
        const heal = more * data.settings.game.slipHeal;
        if (more > 0 && heal > 0) fx.push({ id: newId(), type: 'boss-heal', name: bossName(h.id), heal });
      }
      for (const d of defeats) fx.push({ id: newId(), type: 'boss-defeated', name: bossName(d.habitId), round: d.round });
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
  }, [data, update, epoch]);

  const done = useCallback((id: string) => setQueue((q) => q.filter((f) => f.id !== id)), []);
  return [queue, done] as const;
}
