import type { AppData, Habit, Settings } from './types';
import { newId } from './id';

/**
 * Neutral starting values only. Personal values are entered by the user in
 * the setup wizard or Settings and never live in the code.
 */
export function blankSettings(): Settings {
  return {
    dayStartHour: 4,
    weekStartsOn: 1,
    habits: [],
    workStreams: [],
    wakeBy: '07:00',
    bedBy: '23:00',
  };
}

export function blankHabit(kind: Habit['kind'] = 'fullmin'): Habit {
  return { id: newId(), name: '', kind, fullLabel: '', minLabel: '' };
}

export function createDefaultData(): AppData {
  return { version: 2, setupDone: false, settings: blankSettings(), days: {} };
}
