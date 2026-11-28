/**
 * Bad habits as bosses.
 *
 * Nothing here is stored. Boss HP, rounds, trophies and clean streaks are all
 * worked out by walking the days from when the bad habit was added, using the
 * slips saved on each day.
 *
 * - Each finished clean day deals 1 damage.
 * - Each slip heals the boss (Settings → Points), up to its full HP.
 * - At 0 HP the boss is defeated, becomes a trophy, and the next round starts at full HP.
 * - Today is still going, so it only counts once it's over; today's slips heal straight away.
 */
import type { AppData, BadHabit, LedgerEntry, LedgerKind } from './types';
import { dateKey, parseKey } from './day';
import { newId } from './id';
import { weekKeys } from './schedule';

/** Slips (or uses) logged for a bad habit on a day. */
export const slipsOn = (data: AppData, habitId: string, key: string) => data.days[key]?.slips?.[habitId] ?? 0;

/** Times used so far in the week containing `key`, up to and including that day. */
export function weekUses(data: AppData, h: BadHabit, key: string): number {
  return weekKeys(parseKey(key), data.settings.weekStartsOn)
    .filter((k) => k <= key)
    .reduce((sum, k) => sum + slipsOn(data, h.id, k), 0);
}

/**
 * How many of a day's slips or uses went past what's allowed.
 * Quit: every slip. Daily limit: uses above the limit. Weekly limit: uses that took the week above the limit.
 */
export function excessOn(data: AppData, h: BadHabit, key: string): number {
  const n = slipsOn(data, h.id, key);
  if (!n) return 0;
  if (h.type === 'quit') return n;
  if (h.type === 'daily') return Math.max(0, n - h.limit);
  const after = weekUses(data, h, key);
  const before = after - n;
  return Math.max(0, after - h.limit) - Math.max(0, before - h.limit);
}

export interface Trophy {
  round: number;
  /** App-day the boss was defeated. */
  day: string;
}

/** What one finished day did to a boss. */
export interface DayResult {
  day: string;
  clean: boolean;
  /** Clean straight after a slip. */
  comeback: boolean;
  /** The boss was defeated on this day (its round number). */
  defeated?: number;
}

export interface BossState {
  habit: BadHabit;
  round: number;
  hp: number;
  maxHp: number;
  /** Finished clean days in a row (today counts once it's over). */
  cleanStreak: number;
  bestStreak: number;
  trophies: Trophy[];
  /** Slips or uses logged today. */
  todayCount: number;
  /** Today's slips or uses past the limit. */
  todayExcess: number;
  /** Uses so far this week (weekly limits). */
  weekCount: number;
  days: DayResult[];
}

const nextDay = (key: string) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + 1);
  return dateKey(d);
};

/** Walks every day since the bad habit was added, up to today. */
export function bossState(data: AppData, h: BadHabit, todayKey: string): BossState {
  const heal = Math.max(0, data.settings.game.slipHeal);
  const maxHp = Math.max(1, h.bossTarget);
  const s: BossState = {
    habit: h,
    round: 1,
    hp: maxHp,
    maxHp,
    cleanStreak: 0,
    bestStreak: 0,
    trophies: [],
    todayCount: 0,
    todayExcess: 0,
    weekCount: 0,
    days: [],
  };
  if (h.since > todayKey) return s;

  let lastSlipped = false;
  for (let key = h.since; key < todayKey; key = nextDay(key)) {
    const excess = excessOn(data, h, key);
    if (excess > 0) {
      s.hp = Math.min(maxHp, s.hp + heal * excess);
      s.cleanStreak = 0;
      s.days.push({ day: key, clean: false, comeback: false });
      lastSlipped = true;
      continue;
    }
    const result: DayResult = { day: key, clean: true, comeback: lastSlipped };
    lastSlipped = false;
    s.cleanStreak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.cleanStreak);
    s.hp -= 1;
    if (s.hp <= 0) {
      result.defeated = s.round;
      s.trophies.push({ round: s.round, day: key });
      s.round += 1;
      s.hp = maxHp;
    }
    s.days.push(result);
  }

  s.todayCount = slipsOn(data, h.id, todayKey);
  s.todayExcess = excessOn(data, h, todayKey);
  s.weekCount = weekUses(data, h, todayKey);
  if (s.todayExcess > 0) s.hp = Math.min(maxHp, s.hp + heal * s.todayExcess);
  return s;
}

/** Every named bad habit's boss. */
export function allBosses(data: AppData, todayKey: string): BossState[] {
  return data.settings.badHabits.filter((h) => h.name.trim()).map((h) => bossState(data, h, todayKey));
}

/* ---------- Points for finished days ---------- */

const key = (kind: LedgerKind, day: string, ref: string) => `${kind}|${day}|${ref}`;

/**
 * Adds the points earned by finished days: a clean day, a comeback, a defeated boss.
 * Lines already in the ledger are left alone, so running it again never adds
 * anything twice and never takes points away. Returns the same object when
 * there's nothing new.
 */
export function settleDays(data: AppData, todayKey: string, at: Date = new Date()): AppData {
  const g = data.settings.game;
  const have = new Set(data.ledger.filter((e) => e.kind === 'clean' || e.kind === 'comeback' || e.kind === 'boss').map((e) => key(e.kind, e.day, e.ref)));
  const added: LedgerEntry[] = [];
  const add = (kind: LedgerKind, day: string, ref: string, amount: number, areaId: string) => {
    if (!(amount > 0) || have.has(key(kind, day, ref))) return;
    have.add(key(kind, day, ref));
    added.push({ id: newId(), at: at.toISOString(), day, kind, ref, amount, areaId });
  };

  for (const b of allBosses(data, todayKey)) {
    const h = b.habit;
    for (const d of b.days) {
      if (!d.clean) continue;
      add('clean', d.day, h.id, g.cleanDay, h.areaId);
      if (d.comeback) add('comeback', d.day, h.id, g.comeback, h.areaId);
      if (d.defeated) add('boss', d.day, `${h.id}#${d.defeated}`, g.bossDefeat, h.areaId);
    }
  }
  return added.length ? { ...data, ledger: [...data.ledger, ...added] } : data;
}

/** Short description, e.g. "Quit", "Max 2 a day", "Max 3 a week". */
export function describeReduce(h: BadHabit): string {
  if (h.type === 'quit') return 'Quit';
  return `Max ${h.limit} a ${h.type === 'daily' ? 'day' : 'week'}`;
}
