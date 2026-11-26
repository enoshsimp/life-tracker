import { useRef, useState } from 'react';
import type { AppData } from '../lib/types';
import { readBackup } from '../lib/storage';
import { daysSinceBackup, downloadBackup, markBackedUp } from '../lib/backup';
import { getNow } from '../lib/day';

type Update = (fn: (d: AppData) => AppData) => void;

const ago = (days: number) => (days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`);

/** Saves a backup file and remembers when. */
function backUp(data: AppData, update: Update) {
  downloadBackup(data);
  update((d) => markBackedUp(d));
}

/** The nudge on Today when it's been a week or more since the last backup. */
export function BackupReminder({ data, update }: { data: AppData; update: Update }) {
  const days = daysSinceBackup(data, getNow()) ?? 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-min/40 bg-surface p-3">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-min" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Time for a backup</p>
        <p className="text-xs text-muted">{data.meta.lastBackup ? `Last backup ${ago(days)}.` : 'You haven’t saved a backup yet.'}</p>
      </div>
      <button
        type="button"
        onClick={() => backUp(data, update)}
        className="shrink-0 rounded-full bg-min px-3 py-1.5 text-sm font-bold text-bg"
      >
        Back up
      </button>
    </div>
  );
}

type Message = { ok: boolean; text: string } | null;

/**
 * A button that opens a backup file and restores it. With `askFirst`, it checks before
 * replacing what's on the device.
 */
export function RestoreButton({
  onRestore,
  askFirst,
  onMessage,
  className,
}: {
  onRestore: (d: AppData) => void;
  askFirst: boolean;
  onMessage: (m: Message) => void;
  className: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function restore(file: File) {
    const backup = readBackup(await file.text());
    if (!backup) {
      onMessage({ ok: false, text: 'That file isn’t a Life Tracker backup, so nothing was changed.' });
      return;
    }
    const when = backup.exportedAt ? new Date(backup.exportedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'an unknown date';
    if (askFirst && !window.confirm(`Replace everything on this device with the backup from ${when}?\n\nAnything logged since that backup will be lost.`)) return;
    onRestore(backup.exportedAt ? markBackedUp(backup.data, new Date(backup.exportedAt)) : backup.data);
    onMessage({ ok: true, text: `Restored the backup from ${when}.` });
  }

  return (
    <>
      <button type="button" onClick={() => fileInput.current?.click()} className={className}>
        Choose backup file…
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        aria-label="Backup file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void restore(file);
        }}
      />
    </>
  );
}

/** Settings → Backup: save a backup file, or restore one. */
export function BackupSection({ data, update, replaceData }: { data: AppData; update: Update; replaceData: (d: AppData) => void }) {
  const [message, setMessage] = useState<Message>(null);
  const days = daysSinceBackup(data, getNow());

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <div>
        <p className="font-semibold">Save a backup</p>
        <p className="mt-1 text-xs text-muted">
          Your data only lives on this device. A backup file keeps it safe if the phone is lost or the browser is cleared.{' '}
          {data.meta.lastBackup ? `Last backup ${ago(days ?? 0)}.` : 'No backup saved yet.'}
        </p>
        <button
          type="button"
          onClick={() => {
            backUp(data, update);
            setMessage({ ok: true, text: 'Backup saved. Keep the file somewhere safe, like cloud storage.' });
          }}
          className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg"
        >
          Save backup file
        </button>
      </div>
      <div className="border-t border-line pt-3">
        <p className="font-semibold">Restore from a backup</p>
        <p className="mt-1 text-xs text-muted">Replaces everything on this device with the backup. Older backups are upgraded automatically.</p>
        <RestoreButton
          onRestore={replaceData}
          askFirst
          onMessage={setMessage}
          className="mt-3 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-accent"
        />
      </div>
      {message && <p className={`text-xs font-semibold ${message.ok ? 'text-full' : 'text-red-400'}`}>{message.text}</p>}
    </div>
  );
}
