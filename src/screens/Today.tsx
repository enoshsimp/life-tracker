import { useEffect, useState, type ReactNode } from 'react';
import type { AppData, DayRecord, Habit, TickLevel, TimeOfDay } from '../lib/types';
import { appDayDate, appDayKey, getNow, isOnTime } from '../lib/day';
import { TIMES_OF_DAY } from '../lib/defaults';
import { isShownOn, weeklyCount } from '../lib/schedule';
import { computeStreak, overallLevel, syncDay, totalXp, type LevelInfo } from '../lib/game';
import { HabitRow, PriorityRow, TimeRow } from '../components/TodayRows';
import { BackupReminder } from '../components/Backup';
import { backupDue } from '../lib/backup';

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
  onOpenProgress,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  onOpenSettings: () => void;
  onOpenProgress: () => void;
}) {
  const now = useNow();
  const { settings } = data;
  const key = appDayKey(now, settings.dayStartHour);
  const date = appDayDate(now, settings.dayStartHour);
  const day = data.days[key] ?? emptyDay();
  const beforeReset = now.getHours() < settings.dayStartHour;

  // Rows still being named in Settings are left out until they have a name.
  const habits = settings.habits.filter((h) => h.name.trim() && isShownOn(h, date));
  const workStreams = settings.workStreams.filter((w) => w.name.trim());
  const hasAnyHabits = settings.habits.some((h) => h.name.trim());

  const areaName = (id: string) => {
    const i = settings.areas.findIndex((a) => a.id === id);
    return i < 0 ? '' : settings.areas[i].name.trim() || `Area ${i + 1}`;
  };
  const weekly = (h: Habit) =>
    h.frequency.type === 'weekly' ? { count: weeklyCount(data, h.id, date), target: h.frequency.times } : undefined;

  // Every change to the day also updates its points in the ledger.
  const editDay = (fn: (d: DayRecord) => DayRecord) =>
    update((d) => syncDay({ ...d, days: { ...d.days, [key]: fn(d.days[key] ?? emptyDay()) } }, key));

  const streak = computeStreak(data, date);
  const level = overallLevel(totalXp(data));
  const pointsToday = data.ledger.filter((e) => e.day === key && e.kind !== 'weekly').reduce((s, e) => s + e.amount, 0);

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
  // A times-per-week habit counts as done once ticked today or once its weekly target is met.
  const habitDone = (h: Habit) => {
    if (day.ticks[h.id]) return true;
    const w = weekly(h);
    return !!w && w.count >= w.target;
  };
  const total = habits.length + 2 + workStreams.length;
  const done =
    habits.filter(habitDone).length +
    (day.wake ? 1 : 0) +
    (day.bed ? 1 : 0) +
    workStreams.filter((w) => day.priorities[w.id]?.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const habitRows = (time: TimeOfDay) =>
    habits
      .filter((h) => h.time === time)
      .map((h) => (
        <HabitRow
          key={h.id}
          habit={h}
          tick={day.ticks[h.id]}
          onChange={(lvl) => setTick(h.id, lvl)}
          areaName={areaName(h.areaId)}
          weekly={weekly(h)}
        />
      ));

  // Fixed rows that belong to a time of day: wake in the morning, priorities at work, bed in the evening.
  const groups: Record<TimeOfDay, ReactNode[]> = {
    morning: [
      <TimeRow
        key="wake"
        title="Wake time"
        action="Woke up"
        deadline={settings.wakeBy}
        log={day.wake}
        onLog={() => logTime('wake', settings.wakeBy)}
        onClear={() => clearTime('wake')}
      />,
      ...habitRows('morning'),
    ],
    work: [
      ...workStreams.map((w) => (
        <PriorityRow
          key={w.id}
          streamName={w.name}
          priority={day.priorities[w.id] ?? { text: '', done: false }}
          onChange={(p) => editDay((d) => ({ ...d, priorities: { ...d.priorities, [w.id]: p } }))}
        />
      )),
      ...habitRows('work'),
    ],
    evening: [
      ...habitRows('evening'),
      <TimeRow
        key="bed"
        title="Bedtime"
        action="Going to bed"
        deadline={settings.bedBy}
        log={day.bed}
        onLog={() => logTime('bed', settings.bedBy)}
        onClear={() => clearTime('bed')}
      />,
    ],
    anytime: habitRows('anytime'),
  };

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <GameBar
          level={level}
          streak={streak.current}
          streakAlive={streak.todayDone}
          shieldUsed={streak.shieldUsed}
          pointsToday={pointsToday}
          onClick={onOpenProgress}
        />
        <div className="mt-5 flex items-end justify-between gap-4">
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

      {backupDue(data, now) && <BackupReminder data={data} update={update} />}

      {!hasAnyHabits && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full rounded-2xl border border-dashed border-line p-4 text-left text-sm text-muted hover:border-accent hover:text-accent"
        >
          No habits yet. Add some in Settings →
        </button>
      )}

      {TIMES_OF_DAY.map(
        (t) =>
          groups[t.id].length > 0 && (
            <Section key={t.id} title={t.label}>
              {groups[t.id]}
            </Section>
          ),
      )}
    </div>
  );
}

/** Level, XP bar, streak, shield and today's points. Tapping it opens Progress. */
function GameBar({
  level,
  streak,
  streakAlive,
  shieldUsed,
  pointsToday,
  onClick,
}: {
  level: LevelInfo;
  streak: number;
  streakAlive: boolean;
  shieldUsed: boolean;
  pointsToday: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Progress"
      className="w-full rounded-2xl border border-line bg-surface p-3 text-left hover:border-accent"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-bg">
          <span className="text-center leading-none">
            <span className="block text-[9px] font-bold uppercase">Lv</span>
            <span className="block text-lg font-black tabular-nums">{level.level}</span>
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold text-muted">
              <span className="tabular-nums text-text">{level.into}</span>/{level.need} XP
            </span>
            <span className="font-bold tabular-nums text-full">+{pointsToday} today</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(level.into / level.need) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className={`flex items-center gap-1.5 font-bold ${streakAlive ? 'text-min' : 'text-text'}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-4-1-6 1-9.5z" />
          </svg>
          <span className="tabular-nums">{streak}</span>
          <span className="font-semibold text-muted">day streak</span>
        </span>
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${shieldUsed ? 'text-muted' : 'text-sky-400'}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
            <path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6l7-3z" />
          </svg>
          {shieldUsed ? 'Shield used' : 'Shield ready'}
        </span>
      </div>
    </button>
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
