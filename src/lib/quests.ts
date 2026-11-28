/**
 * Daily quests: three small goals a day, picked from your own habits.
 *
 * They're never stored. The pick comes from a fixed "dice roll" on the date,
 * so the same three show all day, and whether each is done is read from what
 * you logged. Their points are kept in step by syncDay, like ticks.
 */
import type { AppData, TimeOfDay } from './types';
import { TIMES_OF_DAY } from './defaults';
import { appDayKey, minutesIntoAppDay, parseKey } from './day';
import { hash01 } from './hash';
import { isShownOn } from './schedule';
import { COMBO_MIN_ITEMS, groupProgress } from './groups';

export interface Quest {
  /** e.g. "clear:work", "full:<habit id>", "wake". */
  id: string;
  title: string;
  done: boolean;
}

/** "Clear Morning early" means before this time. */
export const EARLY_MORNING = '11:00';

const timeLabel = (t: TimeOfDay) => TIMES_OF_DAY.find((x) => x.id === t)?.label ?? t;

/** Every quest that makes sense for this day, before picking three. */
function candidates(data: AppData, dayKey: string): { id: string; title: string }[] {
  const s = data.settings;
  const date = parseKey(dayKey);
  const groups = groupProgress(data, dayKey);
  const list: { id: string }[] = [];

  for (const t of TIMES_OF_DAY) {
    if (groups[t.id].total < COMBO_MIN_ITEMS) continue;
    list.push({ id: t.id === 'morning' ? 'early:morning' : `clear:${t.id}` });
  }
  for (const h of s.habits) {
    if (h.name.trim() && h.kind === 'fullmin' && isShownOn(h, date)) list.push({ id: `full:${h.id}` });
  }
  list.push({ id: 'wake' }, { id: 'bed' }, { id: 'capture' });
  if (s.workStreams.some((w) => w.name.trim())) list.push({ id: 'priority' });
  if ((s.badHabits ?? []).some((h) => h.name.trim() && h.since <= dayKey)) list.push({ id: 'resist' });
  return list.map((q) => ({ ...q, title: questTitle(data, q.id) }));
}

function isDone(data: AppData, id: string, dayKey: string): boolean {
  const s = data.settings;
  const rec = data.days[dayKey];
  if (id === 'wake') return rec?.wake?.level === 'full';
  if (id === 'bed') return rec?.bed?.level === 'full';
  if (id === 'priority') return Object.values(rec?.priorities ?? {}).some((p) => p.done);
  if (id === 'resist') return Object.values(rec?.resisted ?? {}).some((n) => n > 0);
  if (id === 'capture') return data.inbox.some((i) => appDayKey(new Date(i.createdAt), s.dayStartHour) === dayKey);
  if (id.startsWith('full:')) return rec?.ticks[id.slice(5)] === 'full';
  if (id.startsWith('clear:')) {
    const g = groupProgress(data, dayKey)[id.slice(6) as TimeOfDay];
    return g.total > 0 && g.done === g.total;
  }
  if (id === 'early:morning') {
    // Done if the Morning combo was earned before the cut-off.
    const combo = data.ledger.find((e) => e.kind === 'combo' && e.day === dayKey && e.ref === 'morning');
    if (!combo) return false;
    const at = new Date(combo.at);
    const [h, m] = EARLY_MORNING.split(':').map(Number);
    return minutesIntoAppDay(at.getHours(), at.getMinutes(), s.dayStartHour) <= minutesIntoAppDay(h, m, s.dayStartHour);
  }
  return false;
}

/** Today's three quests (fewer if there aren't enough to choose from). At most one "at full" quest. */
export function questsFor(data: AppData, dayKey: string): Quest[] {
  const ranked = candidates(data, dayKey).sort((a, b) => hash01(`${dayKey}|quest|${a.id}`) - hash01(`${dayKey}|quest|${b.id}`));
  const picked: { id: string; title: string }[] = [];
  for (const q of ranked) {
    if (picked.length === 3) break;
    if (q.id.startsWith('full:') && picked.some((p) => p.id.startsWith('full:'))) continue;
    picked.push(q);
  }
  return picked.map((q) => ({ ...q, done: isDone(data, q.id, dayKey) }));
}

const FIXED_TITLES: Record<string, string> = {
  all: 'All three quests',
  'early:morning': `Clear Morning before ${EARLY_MORNING}`,
  wake: 'Wake up on time',
  bed: 'Be in bed on time',
  capture: 'Capture an idea',
  priority: 'Finish a top priority',
  resist: 'Resist one urge',
};

/** A quest's title for the ledger, using today's names. */
export function questTitle(data: AppData, id: string): string {
  if (FIXED_TITLES[id]) return FIXED_TITLES[id];
  if (id.startsWith('clear:')) return `Clear ${timeLabel(id.slice(6) as TimeOfDay)}`;
  if (id.startsWith('full:')) return `Do ${data.settings.habits.find((h) => h.id === id.slice(5))?.name.trim() || 'a deleted habit'} at full`;
  return 'Quest';
}
