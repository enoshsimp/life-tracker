import type { AppData, Habit } from './types';
import { dateKey } from './day';

/** Whether a habit appears on Today for this date. Weekly-target habits can be done on any day. */
export function isShownOn(habit: Habit, date: Date): boolean {
  const f = habit.frequency;
  return f.type !== 'days' || f.days.includes(date.getDay());
}

/** The 7 "YYYY-MM-DD" keys of the week containing `date`, starting on the user's first weekday. */
export function weekKeys(date: Date, weekStartsOn: 0 | 1): string[] {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() - weekStartsOn + 7) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dateKey(d);
  });
}

/** How many days this week the habit was ticked (full or minimum). */
export function weeklyCount(data: AppData, habitId: string, date: Date): number {
  return weekKeys(date, data.settings.weekStartsOn).filter((k) => data.days[k]?.ticks[habitId]).length;
}

/** Short description of a frequency, e.g. "Every day", "Mon, Wed", "3× a week". */
export function describeFrequency(habit: Habit): string {
  const f = habit.frequency;
  if (f.type === 'daily') return 'Every day';
  if (f.type === 'weekly') return `${f.times}× a week`;
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return f.days.map((d) => names[d]).join(', ') || 'No days picked';
}
