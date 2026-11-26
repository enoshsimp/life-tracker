import type { AppData } from './types';
import { backupFileName, backupText } from './storage';
import { dateKey, parseKey } from './day';

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many days without a backup before Today shows a reminder. */
export const BACKUP_REMINDER_DAYS = 7;

/** Saves a backup file to the device (the Downloads folder, or the phone's Files). */
export function downloadBackup(data: AppData, now: Date = new Date()) {
  const blob = new Blob([backupText(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(now);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before freeing the file.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Records that a backup was just saved. */
export const markBackedUp = (d: AppData, now: Date = new Date()): AppData => ({ ...d, meta: { ...d.meta, lastBackup: now.toISOString() } });

/**
 * Whole days since the last backup, or since the first logged day if there's never been one.
 * Null when there's nothing logged yet (nothing to lose).
 */
export function daysSinceBackup(data: AppData, now: Date): number | null {
  let from: Date;
  if (data.meta.lastBackup) from = new Date(data.meta.lastBackup);
  else {
    const first = Object.keys(data.days).sort()[0];
    if (!first) return null;
    from = parseKey(first);
  }
  const today = parseKey(dateKey(now));
  const since = parseKey(dateKey(from));
  return Math.round((today.getTime() - since.getTime()) / DAY_MS);
}

export const backupDue = (data: AppData, now: Date) => {
  const days = daysSinceBackup(data, now);
  return days !== null && days >= BACKUP_REMINDER_DAYS;
};
