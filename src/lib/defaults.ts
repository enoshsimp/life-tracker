import type { AppData, Settings } from './types';

/**
 * Neutral placeholders only. Real values are entered by the user in the app
 * (first-run setup arrives in Stage 2) and never live in the code.
 */
export const defaultSettings: Settings = {
  dayStartHour: 4,
  habits: [
    { id: 'h1', name: 'Habit 1', kind: 'fullmin', fullLabel: 'Full version', minLabel: 'Minimum version' },
    { id: 'h2', name: 'Habit 2', kind: 'fullmin', fullLabel: 'Full version', minLabel: 'Minimum version' },
    { id: 'gym', name: 'Gym', kind: 'fullmin', fullLabel: 'Full session', minLabel: 'Short session', days: [1, 3, 5] },
    { id: 'c1', name: 'Check-in 1', kind: 'check' },
    { id: 'c2', name: 'Check-in 2', kind: 'check' },
  ],
  workStreams: [
    { id: 'wa', name: 'Work stream A' },
    { id: 'wb', name: 'Work stream B' },
  ],
  wakeBy: '07:00',
  bedBy: '23:00',
};

export function createDefaultData(): AppData {
  return { version: 1, settings: defaultSettings, days: {} };
}
