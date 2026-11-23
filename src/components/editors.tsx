import type { Frequency, Habit, Settings, TimeOfDay, WorkStream } from '../lib/types';
import { blankHabit, TIMES_OF_DAY, WORK_AREA_ID } from '../lib/defaults';
import { newId } from '../lib/id';
import { AddButton, DayPicker, Field, IconButton, NumberInput, Segmented, TextInput, Toggle, inputClass } from './ui';

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

/* ---------- Pieces shared by the habit and gym editors ---------- */

function AreaSelect({ settings, value, onChange }: { settings: Settings; value: string; onChange: (id: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} aria-label="Life area">
      {settings.areas.map((a, i) => (
        <option key={a.id} value={a.id}>
          {a.name.trim() || `Area ${i + 1}`}
        </option>
      ))}
    </select>
  );
}

function TimeOfDayPicker({ value, onChange }: { value: TimeOfDay; onChange: (t: TimeOfDay) => void }) {
  return (
    <Segmented
      compact
      ariaLabel="Time of day"
      value={value}
      onChange={onChange}
      options={TIMES_OF_DAY.map((t) => ({ value: t.id, label: t.label }))}
    />
  );
}

function FrequencyEditor({
  value,
  onChange,
  weekStartsOn,
}: {
  value: Frequency;
  onChange: (f: Frequency) => void;
  weekStartsOn: 0 | 1;
}) {
  const setType = (type: Frequency['type']) => {
    if (type === value.type) return;
    if (type === 'daily') onChange({ type: 'daily' });
    else if (type === 'days') onChange({ type: 'days', days: [1, 2, 3, 4, 5] });
    else onChange({ type: 'weekly', times: 3 });
  };

  return (
    <div className="space-y-2">
      <Segmented
        compact
        ariaLabel="How often"
        value={value.type}
        onChange={setType}
        options={[
          { value: 'daily', label: 'Every day' },
          { value: 'days', label: 'Some days' },
          { value: 'weekly', label: 'Times a week' },
        ]}
      />
      {value.type === 'days' && (
        <DayPicker days={value.days} weekStartsOn={weekStartsOn} onChange={(days) => onChange({ type: 'days', days })} />
      )}
      {value.type === 'weekly' && (
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-2 py-1.5">
          <IconButton label="Fewer times" disabled={value.times <= 1} onClick={() => onChange({ type: 'weekly', times: value.times - 1 })}>
            <path d="M5 12h14" />
          </IconButton>
          <p className="text-sm">
            <span className="text-lg font-black tabular-nums">{value.times}</span>
            <span className="text-muted"> times a week</span>
          </p>
          <IconButton label="More times" disabled={value.times >= 7} onClick={() => onChange({ type: 'weekly', times: value.times + 1 })}>
            <path d="M12 5v14M5 12h14" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

/** Points for a habit's full and minimum versions (one value for a yes/no habit). */
function PointsFields({ habit, onChange }: { habit: Habit; onChange: (p: Partial<Habit>) => void }) {
  if (habit.kind === 'check') {
    return (
      <Field label="Points">
        <NumberInput value={habit.fullPoints} onChange={(fullPoints) => onChange({ fullPoints })} ariaLabel="Points" suffix="pts" />
      </Field>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Full points">
        <NumberInput value={habit.fullPoints} onChange={(fullPoints) => onChange({ fullPoints })} ariaLabel="Full points" suffix="pts" />
      </Field>
      <Field label="Minimum points">
        <NumberInput value={habit.minPoints} onChange={(minPoints) => onChange({ minPoints })} ariaLabel="Minimum points" suffix="pts" />
      </Field>
    </div>
  );
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

          <PointsFields habit={h} onChange={(p) => patch(h.id, p)} />

          <Field label="Life area">
            <AreaSelect settings={settings} value={h.areaId} onChange={(areaId) => patch(h.id, { areaId })} />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Time of day</span>
            <TimeOfDayPicker value={h.time} onChange={(time) => patch(h.id, { time })} />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">How often</span>
            <FrequencyEditor value={h.frequency} weekStartsOn={settings.weekStartsOn} onChange={(frequency) => patch(h.id, { frequency })} />
          </div>
        </div>
      ))}
      <AddButton onClick={() => setHabits((l) => [...l, blankHabit()])}>Add a habit</AddButton>
    </div>
  );
}

/* ---------- Gym ---------- */

/** The setup wizard hides the life area (gym is always Health there); Settings shows it. */
export function GymEditor({ settings, onChange, showArea = true }: EditorProps & { showArea?: boolean }) {
  const gym = settings.habits.find((h) => h.gym);

  const setGym = (next: Habit | undefined) =>
    onChange((s) => ({ ...s, habits: [...s.habits.filter((h) => !h.gym), ...(next ? [next] : [])] }));

  const sessions = !gym
    ? 0
    : gym.frequency.type === 'daily'
      ? 7
      : gym.frequency.type === 'days'
        ? gym.frequency.days.length
        : gym.frequency.times;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4">
        <div>
          <p className="font-semibold">Track gym sessions</p>
          <p className="text-xs text-muted">Pick set days, or a number of sessions a week</p>
        </div>
        <Toggle
          label="Track gym sessions"
          on={!!gym}
          onChange={(on) =>
            setGym(
              on
                ? {
                    ...blankHabit(),
                    name: 'Gym',
                    fullLabel: 'Full session',
                    minLabel: 'Short session',
                    areaId: 'health',
                    frequency: { type: 'days', days: [1, 3, 5] },
                    gym: true,
                  }
                : undefined,
            )
          }
        />
      </div>

      {gym && (
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
          <Field label="How often" hint={`${sessions} sessions a week`}>
            <FrequencyEditor value={gym.frequency} weekStartsOn={settings.weekStartsOn} onChange={(frequency) => setGym({ ...gym, frequency })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Full session">
              <TextInput value={gym.fullLabel ?? ''} onChange={(fullLabel) => setGym({ ...gym, fullLabel })} placeholder="Optional" />
            </Field>
            <Field label="Short session">
              <TextInput value={gym.minLabel ?? ''} onChange={(minLabel) => setGym({ ...gym, minLabel })} placeholder="Optional" />
            </Field>
          </div>
          <PointsFields habit={gym} onChange={(p) => setGym({ ...gym, ...p })} />
          {showArea && (
            <Field label="Life area">
              <AreaSelect settings={settings} value={gym.areaId} onChange={(areaId) => setGym({ ...gym, areaId })} />
            </Field>
          )}
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Time of day</span>
            <TimeOfDayPicker value={gym.time} onChange={(time) => setGym({ ...gym, time })} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Life areas (rename only; there are always 8) ---------- */

export function AreasEditor({ settings, onChange }: EditorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-4">
      {settings.areas.map((a, i) => (
        <TextInput
          key={a.id}
          value={a.name}
          placeholder={`Area ${i + 1}`}
          ariaLabel={`Life area ${i + 1} name`}
          onChange={(name) => onChange((s) => ({ ...s, areas: s.areas.map((x) => (x.id === a.id ? { ...x, name } : x)) }))}
        />
      ))}
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
        <div key={w.id} className="flex items-start gap-1 rounded-2xl border border-line bg-surface p-2 pl-3">
          <div className="flex-1 space-y-2">
            <TextInput
              value={w.name}
              onChange={(name) => setStreams((l) => l.map((x) => (x.id === w.id ? { ...x, name } : x)))}
              placeholder={`Work stream ${String.fromCharCode(65 + (i % 26))}`}
              ariaLabel="Work stream name"
            />
            <AreaSelect
              settings={settings}
              value={w.areaId}
              onChange={(areaId) => setStreams((l) => l.map((x) => (x.id === w.id ? { ...x, areaId } : x)))}
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
      <AddButton onClick={() => setStreams((l) => [...l, { id: newId(), name: '', areaId: WORK_AREA_ID }])}>Add a work stream</AddButton>
    </div>
  );
}

/* ---------- Points and bonuses (per-habit points live on each habit) ---------- */

export function PointsEditor({ settings, onChange }: EditorProps) {
  const g = settings.game;
  const set = (p: Partial<typeof g>) => onChange((s) => ({ ...s, game: { ...s.game, ...p } }));
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">Each habit's own points are set on the habit above.</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Wake / bed on time">
          <NumberInput value={g.sleepFull} onChange={(sleepFull) => set({ sleepFull })} ariaLabel="Wake or bed on time points" suffix="pts" />
        </Field>
        <Field label="Wake / bed late">
          <NumberInput value={g.sleepMin} onChange={(sleepMin) => set({ sleepMin })} ariaLabel="Wake or bed late points" suffix="pts" />
        </Field>
        <Field label="Top priority done">
          <NumberInput value={g.priorityPoints} onChange={(priorityPoints) => set({ priorityPoints })} ariaLabel="Top priority points" suffix="pts" />
        </Field>
        <Field label="Weekly target hit">
          <NumberInput value={g.weeklyBonus} onChange={(weeklyBonus) => set({ weeklyBonus })} ariaLabel="Weekly target bonus" suffix="pts" />
        </Field>
      </div>
      <Field label="Double-points chance" hint="The chance that any tick earns double points">
        <NumberInput
          value={Math.round(g.bonusChance * 100)}
          onChange={(pct) => set({ bonusChance: pct / 100 })}
          max={100}
          ariaLabel="Double-points chance"
          suffix="%"
        />
      </Field>
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
