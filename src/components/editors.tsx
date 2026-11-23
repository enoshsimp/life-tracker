import type { Habit, Settings, WorkStream } from '../lib/types';
import { blankHabit } from '../lib/defaults';
import { newId } from '../lib/id';
import { AddButton, DayPicker, Field, IconButton, Segmented, TextInput, Toggle, inputClass } from './ui';

/**
 * Editors for each group of settings. The setup wizard and the Settings
 * screen share them, so both always offer the same options.
 */
export interface EditorProps {
  settings: Settings;
  onChange: (fn: (s: Settings) => Settings) => void;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ---------- Habits (everything except the gym habit) ---------- */

export function HabitsEditor({ settings, onChange }: EditorProps) {
  const habits = settings.habits.filter((h) => !h.gym);

  const setHabits = (fn: (list: Habit[]) => Habit[]) =>
    onChange((s) => {
      const gym = s.habits.filter((h) => h.gym);
      return { ...s, habits: [...fn(s.habits.filter((h) => !h.gym)), ...gym] };
    });

  const patch = (id: string, p: Partial<Habit>) =>
    setHabits((list) => list.map((h) => (h.id === id ? { ...h, ...p } : h)));

  return (
    <div className="space-y-3">
      {habits.map((h, i) => (
        <div key={h.id} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <TextInput value={h.name} onChange={(name) => patch(h.id, { name })} placeholder={`Habit ${i + 1}`} ariaLabel="Habit name" />
            </div>
            <IconButton label="Move up" disabled={i === 0} onClick={() => setHabits((l) => move(l, i, i - 1))}>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </IconButton>
            <IconButton label="Move down" disabled={i === habits.length - 1} onClick={() => setHabits((l) => move(l, i, i + 1))}>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </IconButton>
            <IconButton label="Delete habit" danger onClick={() => setHabits((l) => l.filter((x) => x.id !== h.id))}>
              <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
            </IconButton>
          </div>

          <Segmented
            ariaLabel="Habit type"
            value={h.kind}
            onChange={(kind) => patch(h.id, { kind })}
            options={[
              { value: 'fullmin', label: 'Full / Minimum' },
              { value: 'check', label: 'Yes / No' },
            ]}
          />

          {h.kind === 'fullmin' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Full version">
                <TextInput value={h.fullLabel ?? ''} onChange={(fullLabel) => patch(h.id, { fullLabel })} placeholder="Optional" />
              </Field>
              <Field label="Minimum version">
                <TextInput value={h.minLabel ?? ''} onChange={(minLabel) => patch(h.id, { minLabel })} placeholder="Optional" />
              </Field>
            </div>
          )}

          <div className="space-y-2">
            <Segmented
              ariaLabel="When this habit is scheduled"
              value={h.days ? 'some' : 'every'}
              onChange={(v) => patch(h.id, { days: v === 'every' ? undefined : [1, 2, 3, 4, 5] })}
              options={[
                { value: 'every', label: 'Every day' },
                { value: 'some', label: 'Some days' },
              ]}
            />
            {h.days && <DayPicker days={h.days} weekStartsOn={settings.weekStartsOn} onChange={(days) => patch(h.id, { days })} />}
          </div>
        </div>
      ))}
      <AddButton onClick={() => setHabits((l) => [...l, blankHabit()])}>Add a habit</AddButton>
    </div>
  );
}

/* ---------- Gym ---------- */

export function GymEditor({ settings, onChange }: EditorProps) {
  const gym = settings.habits.find((h) => h.gym);

  const setGym = (next: Habit | undefined) =>
    onChange((s) => ({ ...s, habits: [...s.habits.filter((h) => !h.gym), ...(next ? [next] : [])] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <div>
          <p className="font-semibold">Track gym sessions</p>
          <p className="text-xs text-muted">Shows on Today only on your gym days</p>
        </div>
        <Toggle
          label="Track gym sessions"
          on={!!gym}
          onChange={(on) =>
            setGym(on ? { ...blankHabit(), name: 'Gym', fullLabel: 'Full session', minLabel: 'Short session', days: [1, 3, 5], gym: true } : undefined)
          }
        />
      </div>

      {gym && (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
          <Field label="Gym days" hint={`${gym.days?.length ?? 0} sessions a week`}>
            <DayPicker days={gym.days ?? []} weekStartsOn={settings.weekStartsOn} onChange={(days) => setGym({ ...gym, days })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Full session">
              <TextInput value={gym.fullLabel ?? ''} onChange={(fullLabel) => setGym({ ...gym, fullLabel })} placeholder="Optional" />
            </Field>
            <Field label="Short session">
              <TextInput value={gym.minLabel ?? ''} onChange={(minLabel) => setGym({ ...gym, minLabel })} placeholder="Optional" />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sleep ---------- */

export function SleepEditor({ settings, onChange }: EditorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4">
      <Field label="Wake up by" hint="Later than this earns the minimum">
        <input type="time" value={settings.wakeBy} onChange={(e) => e.target.value && onChange((s) => ({ ...s, wakeBy: e.target.value }))} className={inputClass} />
      </Field>
      <Field label="In bed by" hint="Later than this earns the minimum">
        <input type="time" value={settings.bedBy} onChange={(e) => e.target.value && onChange((s) => ({ ...s, bedBy: e.target.value }))} className={inputClass} />
      </Field>
    </div>
  );
}

/* ---------- Work streams ---------- */

export function WorkStreamsEditor({ settings, onChange }: EditorProps) {
  const setStreams = (fn: (l: WorkStream[]) => WorkStream[]) => onChange((s) => ({ ...s, workStreams: fn(s.workStreams) }));
  const streams = settings.workStreams;

  return (
    <div className="space-y-2">
      {streams.map((w, i) => (
        <div key={w.id} className="flex items-center gap-1 rounded-2xl border border-line bg-surface p-2 pl-3">
          <div className="flex-1">
            <TextInput
              value={w.name}
              onChange={(name) => setStreams((l) => l.map((x) => (x.id === w.id ? { ...x, name } : x)))}
              placeholder={`Work stream ${String.fromCharCode(65 + (i % 26))}`}
              ariaLabel="Work stream name"
            />
          </div>
          <IconButton label="Move up" disabled={i === 0} onClick={() => setStreams((l) => move(l, i, i - 1))}>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </IconButton>
          <IconButton label="Move down" disabled={i === streams.length - 1} onClick={() => setStreams((l) => move(l, i, i + 1))}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </IconButton>
          <IconButton label="Delete work stream" danger onClick={() => setStreams((l) => l.filter((x) => x.id !== w.id))}>
            <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
          </IconButton>
        </div>
      ))}
      <AddButton onClick={() => setStreams((l) => [...l, { id: newId(), name: '' }])}>Add a work stream</AddButton>
    </div>
  );
}

/* ---------- Day and week ---------- */

export function DayWeekEditor({ settings, onChange }: EditorProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
      <Field label="New day starts at" hint="Anything ticked before this counts for the day before">
        <select
          value={settings.dayStartHour}
          onChange={(e) => onChange((s) => ({ ...s, dayStartHour: Number(e.target.value) }))}
          className={inputClass}
        >
          {Array.from({ length: 7 }, (_, h) => (
            <option key={h} value={h}>
              {h === 0 ? 'Midnight (00:00)' : `${String(h).padStart(2, '0')}:00`}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Week starts on">
        <Segmented
          ariaLabel="Week starts on"
          value={settings.weekStartsOn}
          onChange={(weekStartsOn) => onChange((s) => ({ ...s, weekStartsOn }))}
          options={[
            { value: 1, label: 'Monday' },
            { value: 0, label: 'Sunday' },
          ]}
        />
      </Field>
    </div>
  );
}
