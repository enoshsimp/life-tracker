import type { AppData, Habit, LifeArea, Settings, TimeOfDay } from './types';
import { newId } from './id';

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
  };
}

export function createDefaultData(): AppData {
  return { version: 3, setupDone: false, settings: blankSettings(), days: {}, inbox: [] };
}
