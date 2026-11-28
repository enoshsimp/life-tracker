import type { AppData, BadHabit, Cosmetics, GameSettings, Habit, LifeArea, Settings, TimeOfDay } from './types';
import { newId } from './id';
import { appDayKey, dateKey } from './day';

/**
 * Neutral starting values only. Personal values are entered by the user in
 * the setup wizard or Settings and never live in the code.
 */

/** The 8 life areas. Ids never change; the names can be renamed in Settings. */
export function defaultAreas(): LifeArea[] {
  return [
    { id: 'health', name: 'Health' },
    { id: 'mind', name: 'Mind' },
    { id: 'career', name: 'Career' },
    { id: 'business', name: 'Business' },
    { id: 'wealth', name: 'Wealth' },
    { id: 'relationships', name: 'Relationships' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'self', name: 'Self' },
  ];
}

export const DEFAULT_AREA_ID = 'self';
/** Wake and bed times earn XP for this area. */
export const SLEEP_AREA_ID = 'health';
/** New work streams start in this area. */
export const WORK_AREA_ID = 'career';

/** Neutral starting point values; the user tunes them in Settings. */
export const DEFAULT_FULL_POINTS = 10;
export const DEFAULT_MIN_POINTS = 5;

/** Point values for bad habits and bosses (added in data version 7). */
export function defaultBossGameSettings() {
  return { cleanDay: 5, comeback: 15, resisted: 3, resistedCap: 3, slipHeal: 3, bossDefeat: 100 };
}

/** Point values for combos, quests and the chest (added in data version 8). */
export function defaultPackGameSettings() {
  return { combo: 15, quest: 10, questAll: 25, chestXp: 20 };
}

export function defaultGameSettings(): GameSettings {
  return {
    sleepFull: 10,
    sleepMin: 5,
    priorityPoints: 10,
    weeklyBonus: 25,
    bonusChance: 0.1,
    ...defaultBossGameSettings(),
    ...defaultPackGameSettings(),
  };
}

/** The look everyone starts with. */
export const defaultCosmetics = (): Cosmetics => ({ theme: 'default', badge: 'star' });

/** Clean days a new boss needs to be defeated. */
export const DEFAULT_BOSS_TARGET = 30;

/** When the evening check-in is first offered. */
export const DEFAULT_CHECK_IN_FROM = '20:00';

export const TIMES_OF_DAY: { id: TimeOfDay; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'work', label: 'Work' },
  { id: 'evening', label: 'Evening' },
  { id: 'anytime', label: 'Anytime' },
];

export function blankSettings(): Settings {
  return {
    dayStartHour: 4,
    weekStartsOn: 1,
    areas: defaultAreas(),
    habits: [],
    badHabits: [],
    workStreams: [],
    wakeBy: '07:00',
    bedBy: '23:00',
    checkInFrom: DEFAULT_CHECK_IN_FROM,
    game: defaultGameSettings(),
    rewards: [],
    cosmetics: defaultCosmetics(),
    sound: true,
    haptics: true,
  };
}

export function blankHabit(kind: Habit['kind'] = 'fullmin'): Habit {
  return {
    id: newId(),
    name: '',
    kind,
    fullLabel: '',
    minLabel: '',
    areaId: DEFAULT_AREA_ID,
    time: 'anytime',
    frequency: { type: 'daily' },
    fullPoints: DEFAULT_FULL_POINTS,
    minPoints: DEFAULT_MIN_POINTS,
    // A new habit only counts towards the streak from the day it was added.
    since: dateKey(new Date()),
  };
}

/** A new bad habit, tracked from today's app-day. */
export function blankBadHabit(dayStartHour: number): BadHabit {
  return {
    id: newId(),
    name: '',
    type: 'quit',
    limit: 0,
    bossTarget: DEFAULT_BOSS_TARGET,
    areaId: DEFAULT_AREA_ID,
    since: appDayKey(new Date(), dayStartHour),
  };
}

export function createDefaultData(): AppData {
  return { version: 8, setupDone: false, settings: blankSettings(), days: {}, inbox: [], ledger: [], achievements: {}, chests: {}, meta: {} };
}
