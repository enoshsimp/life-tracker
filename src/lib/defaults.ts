import type { AppData, GameSettings, Habit, LifeArea, Settings, TimeOfDay } from './types';
import { newId } from './id';
import { dateKey } from './day';

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

export function defaultGameSettings(): GameSettings {
  return { sleepFull: 10, sleepMin: 5, priorityPoints: 10, weeklyBonus: 25, bonusChance: 0.1 };
}

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
    workStreams: [],
    wakeBy: '07:00',
    bedBy: '23:00',
    checkInFrom: DEFAULT_CHECK_IN_FROM,
    game: defaultGameSettings(),
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

export function createDefaultData(): AppData {
  return { version: 6, setupDone: false, settings: blankSettings(), days: {}, inbox: [], ledger: [], achievements: {}, meta: {} };
}
