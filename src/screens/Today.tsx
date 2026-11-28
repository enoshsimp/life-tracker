import { useEffect, useState, type ReactNode } from 'react';
import type { AppData, DayRecord, Habit, TickLevel, TimeOfDay } from '../lib/types';
import { appDayDate, appDayKey, getNow, isOnTime, minutesIntoAppDay } from '../lib/day';
import { TIMES_OF_DAY } from '../lib/defaults';
import { isShownOn, weeklyCount } from '../lib/schedule';
import { computeStreak, overallLevel, syncDay, totalXp, type LevelInfo } from '../lib/game';
import { BadHabitRow, HabitRow, PriorityRow, TimeRow } from '../components/TodayRows';
import { allBosses } from '../lib/bosses';
import { useNow } from '../lib/useNow';
import { openChest } from '../lib/chest';
import { questsFor } from '../lib/quests';
import { QuestStrip } from '../components/Quests';
import { BackupReminder } from '../components/Backup';
import { CheckIn, checkInItems } from '../components/CheckIn';
import { CheckIcon } from '../components/TickButton';
import { backupDue } from '../lib/backup';

const emptyDay = (): DayRecord => ({ ticks: {}, priorities: {} });

/** One row on Today, and whether it counts as done for progress and for folding its group. */
interface Row {
  node: ReactNode;
  done: boolean;
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
  const [checkInOpen, setCheckInOpen] = useState(false);
  const { settings } = data;
  const key = appDayKey(now, settings.dayStartHour);
  const date = appDayDate(now, settings.dayStartHour);
  const day = data.days[key] ?? emptyDay();
  const beforeReset = now.getHours() < settings.dayStartHour;

  // Rows still being named in Settings are left out until they have a name.
  const habits = settings.habits.filter((h) => h.name.trim() && isShownOn(h, date));
  const workStreams = settings.workStreams.filter((w) => w.name.trim());
  const hasAnyHabits = settings.habits.some((h) => h.name.trim()) || settings.badHabits.some((h) => h.name.trim());

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

  // Completing the day opens today's chest (once).
  const chestOpen = !!data.chests[key];
  useEffect(() => {
    if (streak.todayDone && !chestOpen) update((d) => openChest(d, key));
  }, [streak.todayDone, chestOpen, key, update]);
  const level = overallLevel(totalXp(data));
  const pointsToday = data.ledger.filter((e) => e.day === key && e.kind !== 'weekly').reduce((s, e) => s + e.amount, 0);

  const setTick = (habitId: string, level: TickLevel | undefined) =>
    editDay((d) => {
      const ticks = { ...d.ticks };
      if (level) ticks[habitId] = level;
      else delete ticks[habitId];
      return { ...d, ticks, checkIn: withoutAnswer(d.checkIn, habitId) };
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

  // A times-per-week habit counts as done once ticked today or once its weekly target is met.
  const habitDone = (h: Habit) => {
    if (day.ticks[h.id]) return true;
    const w = weekly(h);
    return !!w && w.count >= w.target;
  };

  const habitRows = (time: TimeOfDay): Row[] =>
    habits
      .filter((h) => h.time === time)
      .map((h) => ({
        done: habitDone(h),
        node: (
          <HabitRow
            key={h.id}
            habit={h}
            tick={day.ticks[h.id]}
            onChange={(lvl) => setTick(h.id, lvl)}
            areaName={areaName(h.areaId)}
            weekly={weekly(h)}
            notToday={day.checkIn?.[h.id] === 'no'}
          />
        ),
      }));

  // Fixed rows that belong to a time of day: wake in the morning, priorities at work, bed in the evening.
  const groups: Record<TimeOfDay, Row[]> = {
    morning: [
      {
        done: !!day.wake,
        node: (
          <TimeRow
            key="wake"
            title="Wake time"
            action="Woke up"
            deadline={settings.wakeBy}
            log={day.wake}
            onLog={() => logTime('wake', settings.wakeBy)}
            onClear={() => clearTime('wake')}
          />
        ),
      },
      ...habitRows('morning'),
    ],
    work: [
      ...workStreams.map((w) => {
        const priority = day.priorities[w.id] ?? { text: '', done: false };
        return {
          done: priority.done,
          node: (
            <PriorityRow
              key={w.id}
              streamName={w.name}
              priority={priority}
              onChange={(p) =>
                editDay((d) => ({
                  ...d,
                  priorities: { ...d.priorities, [w.id]: p },
                  checkIn: p.done ? withoutAnswer(d.checkIn, w.id) : d.checkIn,
                }))
              }
            />
          ),
        };
      }),
      ...habitRows('work'),
    ],
    evening: [
      ...habitRows('evening'),
      {
        done: !!day.bed,
        node: (
          <TimeRow
            key="bed"
            title="Bedtime"
            action="Going to bed"
            deadline={settings.bedBy}
            log={day.bed}
            onLog={() => logTime('bed', settings.bedBy)}
            onClear={() => clearTime('bed')}
          />
        ),
      },
    ],
    anytime: habitRows('anytime'),
  };

  // Bad habits: clean by default, so they sit apart and don't count towards the ring.
  const bosses = allBosses(data, key).filter((b) => b.habit.since <= key);
  const changeCount = (field: 'slips' | 'resisted', habitId: string, change: 1 | -1) =>
    editDay((d) => {
      const counts = { ...d[field] };
      const n = Math.max(0, (counts[habitId] ?? 0) + change);
      if (n) counts[habitId] = n;
      else delete counts[habitId];
      // Logging a slip replaces a "stayed clean" check-in answer.
      const checkIn = field === 'slips' && change > 0 ? withoutAnswer(d.checkIn, habitId) : d.checkIn;
      return { ...d, [field]: Object.keys(counts).length ? counts : undefined, checkIn };
    });

  const allRows = TIMES_OF_DAY.flatMap((t) => groups[t.id]);
  const total = allRows.length;
  const done = allRows.filter((r) => r.done).length;

  // Evening check-in: offered from the set time until the day resets, while anything is left to answer.
  const [ch, cm] = settings.checkInFrom.split(':').map(Number);
  const checkInTime =
    minutesIntoAppDay(now.getHours(), now.getMinutes(), settings.dayStartHour) >= minutesIntoAppDay(ch, cm, settings.dayStartHour);
  const toCheck = checkInItems(data, key, date);
  const nothingTicked = Object.keys(day.ticks).length === 0;

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
        </div>
        <GameCard
          level={level}
          streak={streak.current}
          streakAlive={streak.todayDone}
          shieldUsed={streak.shieldUsed}
          banked={streak.banked}
          pointsToday={pointsToday}
          done={done}
          total={total}
          onClick={onOpenProgress}
        />
        {beforeReset && (
          <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">
            It's after midnight, so this still counts as{' '}
            {date.toLocaleDateString(undefined, { weekday: 'long' })}. A new day starts at{' '}
            {String(settings.dayStartHour).padStart(2, '0')}:00.
          </p>
        )}
      </header>

      {checkInTime && toCheck.length > 0 && (
        <button
          type="button"
          onClick={() => setCheckInOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-accent p-4 text-left font-bold text-bg active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />
          </svg>
          <span className="flex-1">
            Evening check-in
            <span className="block text-xs font-semibold opacity-80">Swipe through what's left</span>
          </span>
          <span className="rounded-full bg-bg/20 px-2.5 py-0.5 text-sm tabular-nums">{toCheck.length}</span>
        </button>
      )}

      {hasAnyHabits && <QuestStrip quests={questsFor(data, key)} chestOpen={chestOpen} />}

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

      {hasAnyHabits && nothingTicked && (
        <p className="-mb-3 px-1 text-xs text-muted">Tap a card when it's done. Hold it for the minimum. Tap again to undo.</p>
      )}

      {TIMES_OF_DAY.map(
        (t) =>
          groups[t.id].length > 0 && (
            // Keyed by day, so a new day starts with every group open.
            <Section key={`${key}-${t.id}`} title={t.label} rows={groups[t.id]} />
          ),
      )}

      {bosses.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-widest text-muted">
            <span>Bad habits</span>
            <span className="normal-case tracking-normal">Clean unless you log a slip</span>
          </h2>
          <ul className="space-y-2">
            {bosses.map((b) => (
              <BadHabitRow
                key={b.habit.id}
                habit={b.habit}
                areaName={areaName(b.habit.areaId)}
                slips={b.todayCount}
                resisted={day.resisted?.[b.habit.id] ?? 0}
                weekCount={b.weekCount}
                cleanStreak={b.cleanStreak}
                resistedCap={settings.game.resistedCap}
                resistedPoints={settings.game.resisted}
                onSlip={(c) => changeCount('slips', b.habit.id, c)}
                onResist={(c) => changeCount('resisted', b.habit.id, c)}
              />
            ))}
          </ul>
        </section>
      )}

      {checkInOpen && <CheckIn data={data} update={update} dayKey={key} date={date} onClose={() => setCheckInOpen(false)} />}
    </div>
  );
}

/** Removes one evening check-in answer (when the item gets done after all). */
function withoutAnswer(checkIn: DayRecord['checkIn'], id: string): DayRecord['checkIn'] {
  if (!checkIn?.[id]) return checkIn;
  const next = { ...checkIn };
  delete next[id];
  return Object.keys(next).length ? next : undefined;
}

/** Progress ring (today's XP inside), level, streak and shield. Tapping it opens Progress. */
function GameCard({
  level,
  streak,
  streakAlive,
  shieldUsed,
  banked,
  pointsToday,
  done,
  total,
  onClick,
}: {
  level: LevelInfo;
  streak: number;
  streakAlive: boolean;
  shieldUsed: boolean;
  banked: number;
  pointsToday: number;
  done: number;
  total: number;
  onClick: () => void;
}) {
  const pct = total ? done / total : 0;
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${done} of ${total} done today, ${pointsToday} XP today. Level ${level.level}, ${streak} day streak. Open Progress.`}
      className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-3 text-left hover:border-accent"
    >
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
          <circle
            className="ring-arc"
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={pct >= 1 ? 'var(--color-min)' : 'var(--color-full)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center leading-none">
          <span>
            <span className="block text-xl font-black tabular-nums text-full">+{pointsToday}</span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-muted">XP today</span>
            <span className="mt-1 block text-[11px] font-bold tabular-nums">
              {done}/{total}
            </span>
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent px-2 py-0.5 text-sm font-black tabular-nums text-bg">Lv {level.level}</span>
          <span className="text-xs font-semibold text-muted">
            <span className="tabular-nums text-text">{level.into}</span>/{level.need} XP
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(level.into / level.need) * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className={`flex items-center gap-1.5 font-bold ${streakAlive ? 'text-min' : 'text-text'}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-4-1-6 1-9.5z" />
            </svg>
            <span className="tabular-nums">{streak}</span>
            <span className="text-xs font-semibold text-muted">days</span>
          </span>
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${shieldUsed ? 'text-muted' : 'text-sky-400'}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
              <path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6l7-3z" />
            </svg>
            {shieldUsed ? 'Shield used' : 'Shield ready'}
            {banked > 0 && <span className="rounded bg-sky-400/15 px-1 tabular-nums text-sky-400">+{banked}</span>}
          </span>
        </div>
      </div>
    </button>
  );
}

/** A time-of-day group. Once everything in it is done it folds into one line; tap to open it again. */
function Section({ title, rows }: { title: string; rows: Row[] }) {
  const doneCount = rows.filter((r) => r.done).length;
  const complete = doneCount === rows.length;
  const [open, setOpen] = useState(!complete);

  // Fold a moment after the last item is done, so its tick animation can play first.
  useEffect(() => {
    if (!complete) {
      setOpen(true);
      return;
    }
    const id = window.setTimeout(() => setOpen(false), 900);
    return () => window.clearTimeout(id);
  }, [complete]);

  if (complete && !open) {
    return (
      <section>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className="animate-pop flex w-full items-center gap-3 rounded-2xl border border-full/40 bg-surface px-4 py-3 text-left"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-full text-bg">
            <CheckIcon className="h-4 w-4" />
          </span>
          <span className="flex-1 font-bold">{title}</span>
          <span className="text-sm font-bold tabular-nums text-full">
            {doneCount}/{rows.length}
          </span>
          <span className="text-muted" aria-hidden>
            ›
          </span>
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-widest text-muted">
        {complete ? (
          <button type="button" onClick={() => setOpen(false)} aria-expanded className="flex w-full items-center justify-between uppercase tracking-widest">
            <span>{title}</span>
            <span className="text-full">Fold ✓</span>
          </button>
        ) : (
          <>
            <span>{title}</span>
            <span className="tabular-nums">
              {doneCount}/{rows.length}
            </span>
          </>
        )}
      </h2>
      <ul className="space-y-2">{rows.map((r) => r.node)}</ul>
    </section>
  );
}
