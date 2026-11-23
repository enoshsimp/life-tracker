import { useCallback, useEffect, useState } from 'react';
import type { AppData } from './types';
import { createDefaultData } from './defaults';

/** Everything is saved under this one localStorage key. */
const STORAGE_KEY = 'life-tracker';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Future versions upgrade older data here, one version at a time.
    if (parsed.version === 1 && parsed.settings && parsed.days) return parsed as AppData;
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
