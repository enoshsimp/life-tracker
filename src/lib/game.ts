/**
 * The game layer: points, levels, streaks and shields.
 *
 * Points live in the ledger. Everything else here (levels, area XP, streaks,
 * shields, balance) is worked out from the ledger and the day records, never
 * stored a second time.
 */
import type { AppData, Habit, LedgerEntry, LedgerKind } from './types';
import { DEFAULT_AREA_ID, SLEEP_AREA_ID } from './defaults';
import { dateKey, parseKey } from './day';
import { newId } from './id';
import { weekKeys } from './schedule';
import { hash01 } from './hash';
import { COMBO_MIN_ITEMS, groupProgress } from './groups';
import { questsFor } from './quests';

/* ---------- Random bonus ---------- */

/**
 * Whether a tick earns double points. It's decided by the day and the item,
 * not a fresh dice roll, so unticking and re-ticking can't fish for a bonus.
 */
export function isBonus(day: string, kind: LedgerKind, ref: string, chance: number): boolean {
  if (chance <= 0) return false;
  return hash01(`${day}|${kind}|${ref}`) < chance;
}

/* ---------- Keeping the ledger in step with a day's ticks ---------- */

/** Ledger lines that follow what's logged on a day, so undoing removes them. Clean days and bosses are added by settleDays instead. */
const DAY_KINDS = new Set<LedgerKind>(['habit', 'wake', 'bed', 'priority', 'resisted', 'combo', 'quest']);
const entryKey = (e: Pick<LedgerEntry, 'kind' | 'day' | 'ref'>) => `${e.kind}|${e.day}|${e.ref}`;

/**
 * Rewrites the ledger entries for one app-day (and the weekly bonuses for its
 * week) to match what's ticked. Ticking adds points, unticking takes them
 * back, and switching full ↔ minimum adjusts them. Untouched entries keep
 * their id and time.
 */
export function syncDay(data: AppData, dayKey: string, at: Date = new Date(), withGamePack = true): AppData {
  const s = data.settings;
  const g = s.game;
  const rec = data.days[dayKey];
  const date = parseKey(dayKey);
  const week = weekKeys(date, s.weekStartsOn);
  const weekStart = week[0];

  const isReplaced = (e: LedgerEntry) => (DAY_KINDS.has(e.kind) && e.day === dayKey) || (e.kind === 'weekly' && e.day === weekStart);
  const old = new Map(data.ledger.filter(isReplaced).map((e) => [entryKey(e), e]));

  const wanted: Omit<LedgerEntry, 'id' | 'at'>[] = [];
  const earn = (kind: LedgerKind, ref: string, base: number, areaId: string) => {
    if (!(base > 0)) return;
    // A tick's bonus is decided once, when it's first ticked; later changes to the chance don't re-roll it.
    const existing = old.get(entryKey({ kind, day: dayKey, ref }));
    const bonus = existing ? !!existing.bonus : isBonus(dayKey, kind, ref, g.bonusChance);
    wanted.push({ day: dayKey, kind, ref, amount: bonus ? base * 2 : base, areaId, ...(bonus ? { bonus: true } : {}) });
  };

  if (rec) {
    for (const [habitId, level] of Object.entries(rec.ticks)) {
      const h = s.habits.find((x) => x.id === habitId);
      if (!h) continue;
      earn('habit', habitId, level === 'full' || h.kind === 'check' ? h.fullPoints : h.minPoints, h.areaId);
    }
    if (rec.wake) earn('wake', 'wake', rec.wake.level === 'full' ? g.sleepFull : g.sleepMin, SLEEP_AREA_ID);
    if (rec.bed) earn('bed', 'bed', rec.bed.level === 'full' ? g.sleepFull : g.sleepMin, SLEEP_AREA_ID);
    for (const [streamId, p] of Object.entries(rec.priorities)) {
      const w = s.workStreams.find((x) => x.id === streamId);
      if (w && p.done) earn('priority', streamId, g.priorityPoints, w.areaId);
    }
    // Resisted urges: one line per bad habit, up to the daily cap. No double-points dice here.
    for (const [habitId, n] of Object.entries(rec.resisted ?? {})) {
      const h = s.badHabits.find((x) => x.id === habitId);
      const amount = Math.min(n, Math.max(0, g.resistedCap)) * g.resisted;
      if (h && amount > 0) wanted.push({ day: dayKey, kind: 'resisted', ref: habitId, amount, areaId: h.areaId });
    }
  }

  // Weekly targets: one bonus per habit per week, removed again if a tick is undone.
  for (const h of s.habits) {
    if (h.frequency.type !== 'weekly' || !(g.weeklyBonus > 0)) continue;
    const count = week.filter((k) => data.days[k]?.ticks[h.id]).length;
    if (count >= h.frequency.times) {
      wanted.push({ day: weekStart, kind: 'weekly', ref: h.id, amount: g.weeklyBonus, areaId: h.areaId });
    }
  }

  // Combos: a whole time-of-day group done (groups of 2 or more). Their XP goes to the habits' general area, Self.
  const groups: Partial<ReturnType<typeof groupProgress>> = withGamePack ? groupProgress(data, dayKey) : {};
  for (const [time, p] of Object.entries(groups)) {
    if (g.combo > 0 && p.total >= COMBO_MIN_ITEMS && p.done === p.total) {
      wanted.push({ day: dayKey, kind: 'combo', ref: time, amount: g.combo, areaId: DEFAULT_AREA_ID });
    }
  }

  const merge = (list: Omit<LedgerEntry, 'id' | 'at'>[]) =>
    list.map((w): LedgerEntry => {
      const o = old.get(entryKey(w));
      if (o && o.amount === w.amount && o.areaId === w.areaId && !!o.bonus === !!w.bonus) return o;
      return { ...w, id: o?.id ?? newId(), at: o?.at ?? at.toISOString() };
    });

  const kept = data.ledger.filter((e) => !isReplaced(e));
  const next: AppData = { ...data, ledger: [...kept, ...merge(wanted)] };

  // Quests are judged on the updated day (one of them needs the Morning combo's time).
  const quests: Omit<LedgerEntry, 'id' | 'at'>[] = [];
  const list = withGamePack ? questsFor(next, dayKey) : [];
  for (const q of list) if (q.done && g.quest > 0) quests.push({ day: dayKey, kind: 'quest', ref: q.id, amount: g.quest, areaId: DEFAULT_AREA_ID });
  if (list.length === 3 && list.every((q) => q.done) && g.questAll > 0) {
    quests.push({ day: dayKey, kind: 'quest', ref: 'all', amount: g.questAll, areaId: DEFAULT_AREA_ID });
  }
  return quests.length ? { ...next, ledger: [...next.ledger, ...merge(quests)] } : next;
}

/* ---------- Levels ---------- */

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level needs in total. */
  need: number;
}

/** Each level needs a few more points than the last: base, base + step, base + 2×step… */
export function levelFromXp(xp: number, base: number, step: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, xp);
  let need = base;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = base + step * (level - 1);
  }
  return { level, into: rest, need };
}

export const overallLevel = (xp: number) => levelFromXp(xp, 100, 50);
export const areaLevel = (xp: number) => levelFromXp(xp, 50, 25);

/** Total XP earned (spending never lowers your level). */
export const totalXp = (data: AppData) => data.ledger.reduce((sum, e) => sum + Math.max(0, e.amount), 0);

/** Points you can spend: everything earned minus everything spent. */
export const balance = (data: AppData) => data.ledger.reduce((sum, e) => sum + e.amount, 0);

export function areaXp(data: AppData): Record<string, number> {
  const xp: Record<string, number> = {};
  for (const e of data.ledger) if (e.areaId && e.amount > 0) xp[e.areaId] = (xp[e.areaId] ?? 0) + e.amount;
  return xp;
}

/* ---------- Streaks and shields ---------- */

/** Habits that must be done (at least minimum) on this date for the streak: every-day and set-day habits. */
function requiredHabits(data: AppData, date: Date, key: string): Habit[] {
  return data.settings.habits.filter((h) => {
    if (!h.name.trim() || (h.since && h.since > key)) return false;
    if (h.frequency.type === 'daily') return true;
    return h.frequency.type === 'days' && h.frequency.days.includes(date.getDay());
  });
}

/** Every required habit done at least at minimum, plus wake and bed logged. */
function dayComplete(data: AppData, date: Date, key: string): boolean {
  const rec = data.days[key];
  if (!rec?.wake || !rec.bed) return false;
  return requiredHabits(data, date, key).every((h) => rec.ticks[h.id]);
}

/** Every required habit at full, plus wake and bed on time. */
function dayFull(data: AppData, date: Date, key: string): boolean {
  const rec = data.days[key];
  if (!rec || rec.wake?.level !== 'full' || rec.bed?.level !== 'full') return false;
  return requiredHabits(data, date, key).every((h) => rec.ticks[h.id] === 'full');
}

/** Times-a-week habits that missed their target in the week ending on `lastDay`. */
function weeklyMissed(data: AppData, week: string[]): boolean {
  return data.settings.habits.some(
    (h) =>
      h.frequency.type === 'weekly' &&
      h.name.trim() &&
      (!h.since || h.since <= week[0]) &&
      week.filter((k) => data.days[k]?.ticks[h.id]).length < h.frequency.times,
  );
}

export interface StreakInfo {
  /** Days in a row kept alive (shielded days keep it alive but don't add to it). */
  current: number;
  best: number;
  /** Whether this week's shield has already been used. */
  shieldUsed: boolean;
  /** Days with every habit at full. */
  fullDays: number;
  /** Whether today already counts towards the streak. */
  todayDone: boolean;
  /** Spare shields from daily chests, kept until a missed day needs one. */
  banked: number;
}

/** Most shields that can be kept from chests at once. */
export const MAX_BANKED_SHIELDS = 3;

/**
 * Walks every day from the first one logged up to today.
 * - A complete day adds 1.
 * - The first miss in a week uses that week's shield; the streak survives.
 * - A second miss in the same week uses a banked shield from a chest, if there is one; otherwise it resets the streak.
 * - A times-a-week habit that missed its target makes the last day of that week a miss.
 * - Today only counts once it's complete; it never breaks the streak while it's still going.
 * - A shield from a chest can be used from the day after it was found.
 */
export function computeStreak(data: AppData, today: Date): StreakInfo {
  const keys = Object.keys(data.days).sort();
  const todayKey = dateKey(today);
  const chests = data.chests ?? {};
  const info: StreakInfo = { current: 0, best: 0, shieldUsed: false, fullDays: 0, todayDone: false, banked: 0 };
  if (!keys.length || keys[0] > todayKey) {
    info.banked = Math.min(MAX_BANKED_SHIELDS, Object.entries(chests).filter(([k, c]) => k <= todayKey && c.type === 'shield').length);
    return info;
  }

  const weekStartsOn = data.settings.weekStartsOn;
  let shieldUsed = false;
  let banked = 0;
  // Shields found before the first logged day.
  for (const [k, c] of Object.entries(chests)) if (k < keys[0] && c.type === 'shield') banked = Math.min(MAX_BANKED_SHIELDS, banked + 1);
  for (let d = parseKey(keys[0]); dateKey(d) <= todayKey; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    const date = new Date(d);
    const week = weekKeys(date, weekStartsOn);
    if (key === week[0]) shieldUsed = false;

    const complete = dayComplete(data, date, key);
    if (dayFull(data, date, key)) info.fullDays += 1;

    if (key === todayKey) {
      if (complete) {
        info.current += 1;
        info.todayDone = true;
      }
      if (chests[key]?.type === 'shield') banked = Math.min(MAX_BANKED_SHIELDS, banked + 1);
      break;
    }

    const missed = !complete || (key === week[6] && weeklyMissed(data, week));
    if (!missed) info.current += 1;
    else if (!shieldUsed) shieldUsed = true;
    else if (banked > 0) banked -= 1;
    else info.current = 0;
    info.best = Math.max(info.best, info.current);
    if (chests[key]?.type === 'shield') banked = Math.min(MAX_BANKED_SHIELDS, banked + 1);
  }
  info.best = Math.max(info.best, info.current);
  info.shieldUsed = shieldUsed;
  info.banked = banked;
  return info;
}
