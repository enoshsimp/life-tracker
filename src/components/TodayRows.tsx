import { useState, type ReactNode } from 'react';
import type { Habit, Priority, TickLevel, TimeLog } from '../lib/types';
import { formatTime } from '../lib/day';
import { buzz } from '../lib/feedback';
import { CheckIcon, TickButton } from './TickButton';

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

export function HabitRow({
  habit,
  tick,
  onChange,
}: {
  habit: Habit;
  tick: TickLevel | undefined;
  onChange: (next: TickLevel | undefined) => void;
}) {
  const toggle = (level: TickLevel) => onChange(tick === level ? undefined : level);

  if (habit.kind === 'check') {
    return (
      <Card done={!!tick}>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">{habit.name}</p>
          <TickButton active={tick === 'full'} tone="full" onToggle={() => toggle('full')} ariaLabel={`${habit.name}: yes`}>
            Yes
          </TickButton>
        </div>
      </Card>
    );
  }

  return (
    <Card done={!!tick}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{habit.name}</p>
          <p className="truncate text-xs text-muted">
            {tick === 'min' ? habit.minLabel : habit.fullLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <TickButton active={tick === 'min'} tone="min" onToggle={() => toggle('min')} ariaLabel={`${habit.name}: minimum`}>
            Min
          </TickButton>
          <TickButton active={tick === 'full'} tone="full" onToggle={() => toggle('full')} ariaLabel={`${habit.name}: full`}>
            Full
          </TickButton>
        </div>
      </div>
    </Card>
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
