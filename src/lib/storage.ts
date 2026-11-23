import { useCallback, useEffect, useState } from 'react';
import type { AppData } from './types';
import { createDefaultData } from './defaults';

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
  return d.version === 2 ? (d as AppData) : null;
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
