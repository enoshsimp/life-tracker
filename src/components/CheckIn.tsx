import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { AppData, DayRecord, TickLevel } from '../lib/types';
import { isShownOn, weeklyCount } from '../lib/schedule';
import { syncDay } from '../lib/game';
import { weekUses } from '../lib/bosses';
import { buzz } from '../lib/feedback';
import { CheckIcon } from './TickButton';

/** Something the evening check-in asks about. */
export interface CheckInItem {
  id: string;
  /** A bad habit asks "clean or slipped?" instead of "done or not?". */
  type: 'habit' | 'priority' | 'bad';
  title: string;
  /** Small line under the title (version label, work stream…). */
  detail?: string;
  /** Has a minimum version. */
  hasMin: boolean;
}

/**
 * Everything due today that isn't logged yet and hasn't been answered.
 * Bad habits come up only if nothing was logged for them today. Wake and bed are logged by tapping them.
 */
export function checkInItems(data: AppData, key: string, date: Date): CheckInItem[] {
  const day = data.days[key];
  const answered = (id: string) => !!day?.checkIn?.[id];
  const items: CheckInItem[] = [];
  for (const h of data.settings.habits) {
    if (!h.name.trim() || !isShownOn(h, date) || day?.ticks[h.id] || answered(h.id)) continue;
    // A times-per-week habit that already hit its target isn't owed today.
    if (h.frequency.type === 'weekly' && weeklyCount(data, h.id, date) >= h.frequency.times) continue;
    items.push({ id: h.id, type: 'habit', title: h.name, detail: h.kind === 'fullmin' ? h.fullLabel : undefined, hasMin: h.kind === 'fullmin' });
  }
  for (const w of data.settings.workStreams) {
    const p = day?.priorities[w.id];
    // Only priorities that were set today can be done.
    if (!w.name.trim() || !p?.text.trim() || p.done || answered(w.id)) continue;
    items.push({ id: w.id, type: 'priority', title: p.text, detail: `${w.name} priority`, hasMin: false });
  }
  for (const h of data.settings.badHabits) {
    if (!h.name.trim() || h.since > key || day?.slips?.[h.id] || answered(h.id)) continue;
    const detail = h.type === 'quit' ? 'Did you stay clean today?' : `Did you stay within ${h.limit} a ${h.type === 'daily' ? 'day' : 'week'}?`;
    items.push({ id: h.id, type: 'bad', title: h.name, detail, hasMin: false });
  }
  return items;
}

/** full / min = done; no = not done (or, for a bad habit, slipped); clean = a bad habit stayed clean. */
type Answer = 'full' | 'min' | 'no' | 'clean';

/** How far (in pixels) a card has to be dragged to count as a swipe. */
const SWIPE_AT = 90;

/** Full-screen stack of cards: swipe right = done (or clean), left = not done (or slipped). Buttons do the same. */
export function CheckIn({
  data,
  update,
  dayKey,
  date,
  onClose,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  dayKey: string;
  date: Date;
  onClose: () => void;
}) {
  // The list is fixed when the check-in opens, so answering a card doesn't reshuffle the rest.
  const [items] = useState(() => checkInItems(data, dayKey, date));
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<'right' | 'left' | null>(null);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const [tally, setTally] = useState({ done: 0, no: 0, clean: 0, slipped: 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const item = items[index];
  const finished = index >= items.length;
  const bad = item?.type === 'bad';

  function answer(a: Answer) {
    if (!item || leaving) return;
    buzz(a === 'no' ? 'undo' : a === 'clean' ? 'full' : a);
    update((d) => {
      const rec: DayRecord = d.days[dayKey] ?? { ticks: {}, priorities: {} };
      let next: DayRecord;
      if (item.type === 'bad') {
        if (a === 'no') {
          // Slipped: log just enough to go past what's allowed, so the day counts as a slip.
          const h = d.settings.badHabits.find((x) => x.id === item.id);
          const used = h?.type === 'weekly' ? weekUses(d, h, dayKey) : 0;
          const n = !h || h.type === 'quit' ? 1 : h.type === 'daily' ? h.limit + 1 : Math.max(1, h.limit - used + 1);
          next = { ...rec, slips: { ...rec.slips, [item.id]: n } };
        } else next = { ...rec, checkIn: { ...rec.checkIn, [item.id]: 'clean' } };
      } else if (a === 'no') next = { ...rec, checkIn: { ...rec.checkIn, [item.id]: 'no' } };
      else if (item.type === 'habit') next = { ...rec, ticks: { ...rec.ticks, [item.id]: a as TickLevel } };
      else next = { ...rec, priorities: { ...rec.priorities, [item.id]: { ...rec.priorities[item.id], done: true } } };
      return syncDay({ ...d, days: { ...d.days, [dayKey]: next } }, dayKey);
    });
    setTally((t) =>
      item.type === 'bad'
        ? a === 'no'
          ? { ...t, slipped: t.slipped + 1 }
          : { ...t, clean: t.clean + 1 }
        : a === 'no'
          ? { ...t, no: t.no + 1 }
          : { ...t, done: t.done + 1 },
    );
    setLeaving(a === 'no' ? 'left' : 'right');
    // Let the card fly off before the next one comes in.
    window.setTimeout(() => {
      setLeaving(null);
      setDx(0);
      setIndex((i) => i + 1);
    }, 220);
  }

  const onPointerDown = (e: PointerEvent) => {
    if (leaving) return;
    drag.current = { x: e.clientX, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (drag.current?.id === e.pointerId) setDx(e.clientX - drag.current.x);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dx > SWIPE_AT) answer(bad ? 'clean' : 'full');
    else if (dx < -SWIPE_AT) answer('no');
    else setDx(0);
  };

  const offset = leaving ? (leaving === 'left' ? -600 : 600) : dx;
  const lean = Math.max(-1, Math.min(1, dx / SWIPE_AT));
  const summary = [
    (tally.done || !(tally.clean || tally.slipped)) && `${tally.done} done`,
    tally.no > 0 && `${tally.no} not today`,
    tally.clean > 0 && `${tally.clean} clean`,
    tally.slipped > 0 && `${tally.slipped} slipped`,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-bg/95 backdrop-blur" role="dialog" aria-label="Evening check-in">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Evening check-in</p>
            {!finished && (
              <p className="text-xs text-muted tabular-nums">
                {index + 1} of {items.length}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:text-text">
            {finished ? 'Done' : 'Close'}
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {finished ? (
            <div className="animate-zoom-in text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-full text-bg">
                <CheckIcon className="h-10 w-10" />
              </div>
              <p className="mt-4 text-2xl font-black">All checked in</p>
              <p className="mt-1 text-sm text-muted">{summary.join(' · ')}</p>
              <button type="button" onClick={onClose} className="mt-6 rounded-full bg-accent px-6 py-3 font-bold text-bg">
                Back to Today
              </button>
            </div>
          ) : (
            <>
              {/* The next card peeks out behind the current one. */}
              {items[index + 1] && <div className="absolute h-64 w-full max-w-sm translate-y-3 scale-95 rounded-3xl border border-line bg-surface" aria-hidden />}
              <div
                key={item.id}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`press-card relative flex h-64 w-full max-w-sm touch-none flex-col justify-center rounded-3xl border bg-surface p-6 text-center shadow-2xl ${
                  bad ? 'border-red-500/40' : 'border-line'
                }`}
                style={{
                  WebkitTouchCallout: 'none',
                  transform: `translateX(${offset}px) rotate(${offset / 22}deg)`,
                  transition: drag.current ? 'none' : 'transform 220ms ease-out',
                }}
              >
                <span
                  className="absolute left-5 top-5 rounded-lg border-2 border-full px-2 py-0.5 text-sm font-black uppercase text-full"
                  style={{ opacity: Math.max(0, lean) }}
                  aria-hidden
                >
                  {bad ? 'Clean' : 'Done'}
                </span>
                <span
                  className={`absolute right-5 top-5 rounded-lg border-2 px-2 py-0.5 text-sm font-black uppercase ${
                    bad ? 'border-red-400 text-red-400' : 'border-muted text-muted'
                  }`}
                  style={{ opacity: Math.max(0, -lean) }}
                  aria-hidden
                >
                  {bad ? 'Slipped' : 'Not today'}
                </span>
                {bad && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-400">Bad habit</p>}
                <p className="text-2xl font-black">{item.title}</p>
                {item.detail && <p className="mt-2 text-sm text-muted">{item.detail}</p>}
                <p className="mt-6 text-xs text-muted">{bad ? 'Swipe right if clean, left if you slipped' : 'Swipe right if done, left if not'}</p>
              </div>
            </>
          )}
        </div>

        {!finished && (
          <div className="flex items-center justify-center gap-4 pb-2">
            <RoundButton label={bad ? 'Slipped' : 'Not today'} onClick={() => answer('no')} className={bad ? 'border-red-400 text-red-400' : 'border-line text-muted'}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </RoundButton>
            {item.hasMin && (
              <RoundButton label="Minimum" onClick={() => answer('min')} className="border-min text-min" small>
                <span className="text-xs font-black uppercase">Min</span>
              </RoundButton>
            )}
            <RoundButton label={bad ? 'Clean' : 'Done'} onClick={() => answer(bad ? 'clean' : 'full')} className="border-full bg-full text-bg">
              <CheckIcon className="h-7 w-7" />
            </RoundButton>
          </div>
        )}
      </div>
    </div>
  );
}

function RoundButton({
  label,
  onClick,
  className,
  small,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full border-2 active:scale-90 ${small ? 'h-14 w-14' : 'h-16 w-16'} ${className}`}
    >
      {children}
    </button>
  );
}
