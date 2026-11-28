import { useState, type ReactNode } from 'react';
import type { BadHabit, Habit, Priority, TickLevel, TimeLog } from '../lib/types';
import { formatTime } from '../lib/day';
import { buzz } from '../lib/feedback';
import { usePressHold } from '../lib/usePressHold';
import { CheckIcon } from './TickButton';

function Card({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li
      className={`rounded-2xl border bg-surface p-4 transition-colors duration-300 ${
        done ? 'border-full/40' : 'border-line'
      }`}
    >
      {children}
    </li>
  );
}

/* ---------- Habit with full/minimum versions, or a yes/no check ---------- */

/** Small line under a habit's name: its life area, its weekly progress, and the version label. */
function HabitMeta({ areaName, weekly, label }: { areaName: string; weekly?: { count: number; target: number }; label?: string }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
      <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 font-semibold">{areaName}</span>
      {weekly && (
        <span className={`shrink-0 font-bold tabular-nums ${weekly.count >= weekly.target ? 'text-full' : 'text-text'}`}>
          {weekly.count}/{weekly.target} this week
        </span>
      )}
      {label && <span className="truncate">{label}</span>}
    </p>
  );
}

/**
 * The whole card is the button: tap = done (full), hold = minimum, tap a done card = undo.
 * Yes/No habits have no minimum, so holding one simply ticks it.
 */
export function HabitRow({
  habit,
  tick,
  onChange,
  areaName,
  weekly,
  notToday,
}: {
  habit: Habit;
  tick: TickLevel | undefined;
  onChange: (next: TickLevel | undefined) => void;
  areaName: string;
  /** Progress for a times-per-week habit. */
  weekly?: { count: number; target: number };
  /** Answered "not done" in the evening check-in. */
  notToday?: boolean;
}) {
  const [burst, setBurst] = useState(0);
  const hasMin = habit.kind === 'fullmin';
  const weekDone = !!weekly && weekly.count >= weekly.target;

  const set = (level: TickLevel | undefined) => {
    if (level) {
      setBurst((n) => n + 1);
      buzz(level);
    } else buzz('undo');
    onChange(level);
  };
  const { holding, handlers } = usePressHold(
    () => set(tick ? undefined : 'full'),
    () => set(hasMin ? 'min' : 'full'),
  );

  const tone = tick === 'min' ? 'min' : 'full';
  const label = hasMin ? (tick === 'min' ? habit.minLabel : habit.fullLabel) : undefined;
  const state = tick === 'min' ? 'done at minimum' : tick ? 'done' : 'not done';

  return (
    <li>
      <button
        type="button"
        {...handlers}
        // Stops the iPhone long-press menu. Set here because the CSS build drops this Safari-only setting.
        style={{ WebkitTouchCallout: 'none' }}
        aria-label={`${habit.name}: ${state}. ${tick ? 'Tap to undo.' : hasMin ? 'Tap for full, hold for minimum.' : 'Tap when done.'}`}
        className={`press-card relative w-full overflow-hidden rounded-2xl border bg-surface p-4 text-left transition-colors duration-300 ${
          tick ? (tick === 'min' ? 'border-min/50' : 'border-full/50') : weekDone ? 'border-full/40' : 'border-line'
        }`}
      >
        {/* Fills from the left while you hold, so you can see the hold working. */}
        {holding && hasMin && <span className="hold-fill bg-min/15" aria-hidden />}
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className={`font-semibold ${tick ? 'text-muted' : ''}`}>{habit.name}</p>
            <HabitMeta areaName={areaName} weekly={weekly} label={notToday && !tick ? 'Not today' : label} />
          </div>
          <span
            className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition-colors ${
              tick ? (tone === 'min' ? 'border-min bg-min text-bg' : 'border-full bg-full text-bg') : 'border-line text-muted'
            }`}
            aria-hidden
          >
            <span key={burst} className={`grid place-items-center ${burst && tick ? 'animate-pop' : ''}`}>
              {tick === 'min' ? <span className="text-[10px] font-black uppercase">Min</span> : tick ? <CheckIcon className="h-5 w-5" /> : null}
            </span>
            {burst > 0 && tick && <span key={`r${burst}`} className={`burst-ring ${tone === 'min' ? 'text-min' : 'text-full'}`} />}
          </span>
        </div>
      </button>
    </li>
  );
}

/* ---------- Bad habit: clean by default, log slips and resisted urges ---------- */

/**
 * A bad habit counts as clean unless you log a slip. Each button adds one;
 * the count next to it removes the last one (today only).
 */
export function BadHabitRow({
  habit,
  areaName,
  slips,
  resisted,
  weekCount,
  cleanStreak,
  resistedCap,
  resistedPoints,
  onSlip,
  onResist,
}: {
  habit: BadHabit;
  areaName: string;
  /** Slips (quit) or uses (limits) today. */
  slips: number;
  resisted: number;
  /** Uses so far this week, for a weekly limit. */
  weekCount: number;
  cleanStreak: number;
  resistedCap: number;
  resistedPoints: number;
  onSlip: (change: 1 | -1) => void;
  onResist: (change: 1 | -1) => void;
}) {
  const [burst, setBurst] = useState(0);
  const slipWord = habit.type === 'quit' ? 'Slipped' : 'Used one';

  let status: { text: string; bad: boolean };
  if (habit.type === 'quit') status = slips ? { text: `Slipped ×${slips} today`, bad: true } : { text: 'Clean today', bad: false };
  else if (habit.type === 'daily')
    status = slips > habit.limit ? { text: `Over by ${slips - habit.limit} today`, bad: true } : { text: `${slips} of ${habit.limit} used today`, bad: false };
  else {
    const left = habit.limit - weekCount;
    status = left < 0 ? { text: `Over by ${-left} this week`, bad: true } : { text: `${left} of ${habit.limit} left this week`, bad: false };
  }
  const xpLeft = resisted < resistedCap && resistedPoints > 0;

  return (
    <li className={`rounded-2xl border bg-surface p-4 transition-colors duration-300 ${status.bad ? 'border-red-500/40' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">{habit.name}</p>
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 font-semibold">{areaName}</span>
            <span className={`truncate font-bold ${status.bad ? 'text-red-400' : 'text-full'}`}>{status.text}</span>
          </p>
        </div>
        {cleanStreak > 0 && (
          <span className="shrink-0 text-right text-xs font-semibold text-muted">
            <span className="block text-lg font-black tabular-nums leading-none text-full">{cleanStreak}</span>
            clean {cleanStreak === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <CountButton
          label="Resisted"
          sub={xpLeft ? `+${resistedPoints} XP` : 'Logged'}
          count={resisted}
          tone="good"
          burst={burst}
          onAdd={() => {
            buzz('full');
            setBurst((n) => n + 1);
            onResist(1);
          }}
          onRemove={() => {
            buzz('undo');
            onResist(-1);
          }}
          removeLabel={`Remove the last resisted urge (${resisted} today)`}
        />
        <CountButton
          label={slipWord}
          count={slips}
          tone="bad"
          onAdd={() => {
            buzz('min');
            onSlip(1);
          }}
          onRemove={() => {
            buzz('undo');
            onSlip(-1);
          }}
          removeLabel={`Remove the last ${habit.type === 'quit' ? 'slip' : 'use'} (${slips} today)`}
        />
      </div>
    </li>
  );
}

/** A button that adds one, with a count beside it that removes the last one. */
function CountButton({
  label,
  sub,
  count,
  tone,
  burst = 0,
  onAdd,
  onRemove,
  removeLabel,
}: {
  label: string;
  sub?: string;
  count: number;
  tone: 'good' | 'bad';
  burst?: number;
  onAdd: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  const text = tone === 'good' ? 'text-full' : 'text-red-400';
  const border = tone === 'good' ? 'border-full/50' : 'border-red-500/50';
  return (
    <div className="flex flex-1 overflow-hidden rounded-xl border border-line bg-surface-2">
      <button type="button" onClick={onAdd} className={`relative flex-1 px-3 py-2 text-left active:scale-[0.97] ${text}`}>
        <span key={burst} className={`block text-sm font-bold ${burst ? 'animate-pop' : ''}`}>
          {label}
        </span>
        {sub && <span className="block text-[11px] font-semibold text-muted">{sub}</span>}
      </button>
      {count > 0 && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title="Tap to remove the last one"
          className={`flex shrink-0 items-center gap-1 border-l px-3 text-sm font-black tabular-nums ${border} ${text}`}
        >
          ×{count}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ---------- Wake / bed: tap to record the current time ---------- */

export function TimeRow({
  title,
  action,
  deadline,
  log,
  onLog,
  onClear,
}: {
  title: string;
  action: string;
  deadline: string;
  log: TimeLog | undefined;
  onLog: () => TickLevel;
  onClear: () => void;
}) {
  const [burst, setBurst] = useState(0);

  function handleLog() {
    const level = onLog();
    setBurst((n) => n + 1);
    buzz(level);
  }

  return (
    <Card done={!!log}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted">Full by {deadline}</p>
        </div>
        {log ? (
          <div key={burst} className={`flex items-center gap-3 ${burst ? 'animate-pop' : ''}`}>
            <div className="text-right">
              <p className="text-2xl font-black tabular-nums leading-none">{formatTime(log.at)}</p>
              <p className={`mt-1 text-xs font-bold uppercase tracking-wide ${log.level === 'full' ? 'text-full' : 'text-min'}`}>
                {log.level === 'full' ? 'Full' : 'Minimum'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                buzz('undo');
                onClear();
              }}
              className="rounded-full px-2 py-1 text-xs text-muted hover:text-text"
              aria-label={`Undo ${title.toLowerCase()} time`}
            >
              Undo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLog}
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-bg active:scale-95"
          >
            {action}
          </button>
        )}
      </div>
    </Card>
  );
}

/* ---------- Top priority per work stream ---------- */

export function PriorityRow({
  streamName,
  priority,
  onChange,
}: {
  streamName: string;
  priority: Priority;
  onChange: (next: Priority) => void;
}) {
  const [burst, setBurst] = useState(0);
  const canTick = priority.text.trim().length > 0;

  function toggleDone() {
    if (!canTick) return;
    if (!priority.done) {
      setBurst((n) => n + 1);
      buzz('full');
    } else {
      buzz('undo');
    }
    onChange({ ...priority, done: !priority.done });
  }

  return (
    <Card done={priority.done}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{streamName}</p>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={priority.text}
          onChange={(e) => onChange({ ...priority, text: e.target.value })}
          placeholder="Today's one priority"
          aria-label={`${streamName} top priority`}
          className={`min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-base outline-none placeholder:text-muted/70 focus:border-accent ${
            priority.done ? 'text-muted line-through' : ''
          }`}
        />
        <button
          type="button"
          onClick={toggleDone}
          disabled={!canTick}
          aria-pressed={priority.done}
          aria-label={`Mark ${streamName} priority done`}
          className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition-colors disabled:opacity-30 ${
            priority.done ? 'border-full bg-full text-bg' : 'border-line text-muted'
          }`}
        >
          <span key={burst} className={burst && priority.done ? 'animate-pop' : ''}>
            {priority.done ? <CheckIcon className="h-5 w-5" /> : null}
          </span>
          {burst > 0 && priority.done && <span key={`r${burst}`} className="burst-ring text-full" />}
        </button>
      </div>
    </Card>
  );
}
