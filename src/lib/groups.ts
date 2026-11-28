import type { AppData, Habit, TimeOfDay } from './types';
import { isShownOn, weekKeys } from './schedule';
import { parseKey } from './day';

export interface GroupProgress {
  done: number;
  total: number;
}

/** Done for the day: ticked, or a times-a-week habit whose weekly target is already met. */
export function habitDoneOn(data: AppData, h: Habit, dayKey: string): boolean {
  if (data.days[dayKey]?.ticks[h.id]) return true;
  if (h.frequency.type !== 'weekly') return false;
  const count = weekKeys(parseKey(dayKey), data.settings.weekStartsOn).filter((k) => data.days[k]?.ticks[h.id]).length;
  return count >= h.frequency.times;
}

/**
 * How much of each time-of-day group on Today is done, counted the same way as
 * Today's own groups: wake time in the morning, priorities at work, bedtime in the evening.
 */
export function groupProgress(data: AppData, dayKey: string): Record<TimeOfDay, GroupProgress> {
  const s = data.settings;
  const rec = data.days[dayKey];
  const date = parseKey(dayKey);
  const habits = s.habits.filter((h) => h.name.trim() && isShownOn(h, date));
  const of = (time: TimeOfDay, extra: boolean[] = []): GroupProgress => {
    const list = [...habits.filter((h) => h.time === time).map((h) => habitDoneOn(data, h, dayKey)), ...extra];
    return { done: list.filter(Boolean).length, total: list.length };
  };
  return {
    morning: of('morning', [!!rec?.wake]),
    work: of(
      'work',
      s.workStreams.filter((w) => w.name.trim()).map((w) => !!rec?.priorities[w.id]?.done),
    ),
    evening: of('evening', [!!rec?.bed]),
    anytime: of('anytime'),
  };
}

/** A group earns a combo when it has at least this many items and all are done. */
export const COMBO_MIN_ITEMS = 2;
