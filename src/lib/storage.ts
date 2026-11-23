import { useCallback, useEffect, useState } from 'react';
import type { AppData } from './types';
import {
  createDefaultData,
  defaultAreas,
  defaultGameSettings,
  DEFAULT_AREA_ID,
  DEFAULT_FULL_POINTS,
  DEFAULT_MIN_POINTS,
  WORK_AREA_ID,
} from './defaults';
import { syncDay } from './game';
import { parseKey } from './day';

/** Everything is saved under this one localStorage key. */
const STORAGE_KEY = 'life-tracker';

/** Upgrades older saved data to the current version, one version at a time. */
function migrate(raw: any): AppData | null {
  if (!raw || typeof raw !== 'object' || !raw.settings || !raw.days) return null;
  let d = raw;
  if (d.version === 1) {
    // Version 1 only ever held placeholder settings, so setup still needs to run.
    d = { ...d, version: 2, setupDone: false, settings: { ...d.settings, weekStartsOn: 1 } };
  }
  if (d.version === 2) {
    // Version 3 adds life areas, time of day, frequency and the Inbox.
    // Existing habits keep their schedule and go to area Self, time Anytime.
    const habits = (d.settings.habits ?? []).map(({ days, ...h }: any) => ({
      ...h,
      areaId: DEFAULT_AREA_ID,
      time: 'anytime',
      frequency: Array.isArray(days) ? { type: 'days', days } : { type: 'daily' },
    }));
    d = { ...d, version: 3, settings: { ...d.settings, areas: defaultAreas(), habits }, inbox: [] };
  }
  if (d.version === 3) {
    // Version 4 adds the game layer: point values, the ledger and badges.
    // Every tick already saved earns its points now, so nothing is lost.
    const settings = {
      ...d.settings,
      game: defaultGameSettings(),
      habits: d.settings.habits.map((h: any) => ({ ...h, fullPoints: DEFAULT_FULL_POINTS, minPoints: DEFAULT_MIN_POINTS })),
      workStreams: d.settings.workStreams.map((w: any) => ({ ...w, areaId: WORK_AREA_ID })),
    };
    let next: AppData = { ...d, version: 4, settings, ledger: [], achievements: {} };
    for (const key of Object.keys(next.days).sort()) {
      const noon = parseKey(key);
      noon.setHours(12);
      next = syncDay(next, key, noon);
    }
    d = next;
  }
  return d.version === 4 ? (d as AppData) : null;
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = migrate(JSON.parse(raw));
      if (data) return data;
    }
  } catch {
    // Unreadable data: fall through to a fresh start rather than crash.
  }
  return createDefaultData();
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (e.g. some private modes): keep working in memory.
  }
}

/** App data held in React state and written to localStorage on every change. */
export function useAppData() {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => save(data), [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  return [data, update] as const;
}
