import { useEffect, useState, type ReactNode } from 'react';
import type { AppData, DayRecord, TickLevel } from '../lib/types';
import { appDayDate, appDayKey, getNow, isOnTime } from '../lib/day';
import { HabitRow, PriorityRow, TimeRow } from '../components/TodayRows';

const emptyDay = (): DayRecord => ({ ticks: {}, priorities: {} });

/** Re-reads the clock every 30 seconds and when the app comes back into view, so the day rolls over at the reset hour. */
function useNow() {
  const [now, setNow] = useState(getNow);
  useEffect(() => {
    const refresh = () => setNow(getNow());
    const id = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return now;
}

export function Today({
  data,
  update,
  onOpenSettings,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  onOpenSettings: () => void;
}) {
  const now = useNow();
  const { settings } = data;
  const key = appDayKey(now, settings.dayStartHour);
  const date = appDayDate(now, settings.dayStartHour);
  const day = data.days[key] ?? emptyDay();
  const beforeReset = now.getHours() < settings.dayStartHour;

  // Rows still being named in Settings are left out until they have a name.
  const habits = settings.habits.filter((h) => h.name.trim() && (!h.days || h.days.includes(date.getDay())));
  const workStreams = settings.workStreams.filter((w) => w.name.trim());
  const hasAnyHabits = settings.habits.some((h) => h.name.trim());

  const editDay = (fn: (d: DayRecord) => DayRecord) =>
    update((d) => ({ ...d, days: { ...d.days, [key]: fn(d.days[key] ?? emptyDay()) } }));

  const setTick = (habitId: string, level: TickLevel | undefined) =>
    editDay((d) => {
      const ticks = { ...d.ticks };
      if (level) ticks[habitId] = level;
      else delete ticks[habitId];
      return { ...d, ticks };
    });

  const logTime = (which: 'wake' | 'bed', deadline: string): TickLevel => {
    const at = getNow();
    const level: TickLevel = isOnTime(at, deadline, settings.dayStartHour) ? 'full' : 'min';
    editDay((d) => ({ ...d, [which]: { at: at.toISOString(), level } }));
    return level;
  };

  const clearTime = (which: 'wake' | 'bed') =>
    editDay((d) => {
      const next = { ...d };
      delete next[which];
      return next;
    });

  // Progress: every habit shown today, wake, bed and each work-stream priority.
  const total = habits.length + 2 + workStreams.length;
  const done =
    habits.filter((h) => day.ticks[h.id]).length +
    (day.wake ? 1 : 0) +
    (day.bed ? 1 : 0) +
    workStreams.filter((w) => day.priorities[w.id]?.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {date.toLocaleDateString(undefined, { weekday: 'long' })}
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
            </h1>
          </div>
          <p className="text-right">
            <span className="text-4xl font-black tabular-nums">{done}</span>
            <span className="text-xl font-bold text-muted tabular-nums">/{total}</span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Today's progress">
          <div className="h-full rounded-full bg-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        {beforeReset && (
          <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
            It's after midnight, so this still counts as{' '}
            {date.toLocaleDateString(undefined, { weekday: 'long' })}. A new day starts at{' '}
            {String(settings.dayStartHour).padStart(2, '0')}:00.
          </p>
        )}
      </header>

      {habits.length > 0 ? (
        <Section title="Habits">
          {habits.map((h) => (
            <HabitRow key={h.id} habit={h} tick={day.ticks[h.id]} onChange={(lvl) => setTick(h.id, lvl)} />
          ))}
        </Section>
      ) : (
        !hasAnyHabits && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full rounded-2xl border border-dashed border-line p-4 text-left text-sm text-muted hover:border-accent hover:text-accent"
          >
            No habits yet. Add some in Settings →
          </button>
        )
      )}

      <Section title="Sleep">
        <TimeRow
          title="Wake time"
          action="Woke up"
          deadline={settings.wakeBy}
          log={day.wake}
          onLog={() => logTime('wake', settings.wakeBy)}
          onClear={() => clearTime('wake')}
        />
        <TimeRow
          title="Bedtime"
          action="Going to bed"
          deadline={settings.bedBy}
          log={day.bed}
          onLog={() => logTime('bed', settings.bedBy)}
          onClear={() => clearTime('bed')}
        />
      </Section>

      {workStreams.length > 0 && (
      <Section title="Top priorities">
        {workStreams.map((w) => (
          <PriorityRow
            key={w.id}
            streamName={w.name}
            priority={day.priorities[w.id] ?? { text: '', done: false }}
            onChange={(p) => editDay((d) => ({ ...d, priorities: { ...d.priorities, [w.id]: p } }))}
          />
        ))}
      </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}
