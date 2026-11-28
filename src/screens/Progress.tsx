import { useState, type ReactNode } from 'react';
import type { AppData, LedgerEntry } from '../lib/types';
import { appDayDate, getNow, parseKey } from '../lib/day';
import { areaLevel, areaXp, balance, computeStreak, overallLevel, totalXp } from '../lib/game';
import { BADGES } from '../lib/achievements';
import { BadgeIcon } from '../components/Celebrations';
import { TIMES_OF_DAY } from '../lib/defaults';
import { questTitle } from '../lib/quests';

/** Your character sheet: level, streak, life-area stats, badges and the points ledger. */
export function Progress({ data }: { data: AppData }) {
  const [showAll, setShowAll] = useState(false);
  const today = appDayDate(getNow(), data.settings.dayStartHour);
  const xp = totalXp(data);
  const level = overallLevel(xp);
  const streak = computeStreak(data, today);
  const perArea = areaXp(data);
  const ledger = [...data.ledger].sort((a, b) => (a.at < b.at ? 1 : -1));
  const shown = showAll ? ledger : ledger.slice(0, 30);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Level" value={level.level} accent />
        <Stat label="Total XP" value={xp} />
        <Stat label="Balance" value={balance(data)} hint="pts to spend" />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Level {level.level}</span>
          <span className="tabular-nums">
            {level.into}/{level.need} XP to level {level.level + 1}
          </span>
        </div>
        <Bar value={level.into / level.need} className="bg-accent" />
      </div>

      <Section title="Streak">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Current" value={streak.current} hint="days" />
          <Stat label="Best" value={streak.best} hint="days" />
          <Stat label="Shield" value={streak.shieldUsed ? 'Used' : 'Ready'} hint={streak.banked ? `+${streak.banked} banked` : 'this week'} />
        </div>
        <p className="mt-2 text-xs text-muted">
          A day counts when every habit due that day is done (at least minimum) and wake and bed are logged. One missed day a week is
          covered by the shield. Shields from daily chests (up to 3) cover extra missed days.
        </p>
      </Section>

      <Section title="Life areas">
        <ul className="space-y-3 rounded-2xl border border-line bg-surface p-4">
          {data.settings.areas.map((a, i) => {
            const info = areaLevel(perArea[a.id] ?? 0);
            return (
              <li key={a.id}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{a.name.trim() || `Area ${i + 1}`}</span>
                  <span className="text-xs text-muted">
                    <span className="font-bold text-text">Lv {info.level}</span> · {perArea[a.id] ?? 0} XP
                  </span>
                </div>
                <Bar value={info.into / info.need} className="bg-full" />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={`Badges (${Object.keys(data.achievements).length}/${BADGES.length})`}>
        <ul className="grid grid-cols-2 gap-2">
          {BADGES.map((b) => {
            const at = data.achievements[b.id];
            return (
              <li key={b.id} className={`rounded-2xl border p-3 ${at ? 'border-min/40 bg-surface' : 'border-line bg-surface opacity-40'}`}>
                <div className={`mb-2 grid h-9 w-9 place-items-center rounded-full ${at ? 'bg-min text-bg' : 'bg-surface-2 text-muted'}`}>
                  <BadgeIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold">{b.name}</p>
                <p className="text-xs text-muted">{b.description}</p>
                {at && <p className="mt-1 text-[11px] text-min">{new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Points ledger">
        {ledger.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">Tick something on Today to earn your first points.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {shown.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ledgerLabel(data, e)}</p>
                  <p className="text-xs text-muted">
                    {parseKey(e.day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    {e.kind === 'weekly' && ' (week of)'}
                    {e.bonus && <span className="ml-1.5 font-bold text-min">2× bonus</span>}
                  </p>
                </div>
                <span className={`shrink-0 font-black tabular-nums ${e.amount >= 0 ? 'text-full' : 'text-red-400'}`}>
                  {e.amount >= 0 ? '+' : ''}
                  {e.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
        {ledger.length > shown.length && (
          <button type="button" onClick={() => setShowAll(true)} className="mt-2 w-full py-2 text-sm font-semibold text-accent">
            Show all {ledger.length} entries
          </button>
        )}
      </Section>
    </div>
  );
}

/** What a ledger line was for, using today's names (an item deleted since shows as "Deleted …"). */
function ledgerLabel(data: AppData, e: LedgerEntry): string {
  const habit = () => data.settings.habits.find((h) => h.id === e.ref)?.name || 'Deleted habit';
  const badHabit = (id: string) => data.settings.badHabits.find((h) => h.id === id)?.name || 'Deleted bad habit';
  switch (e.kind) {
    case 'habit':
      return habit();
    case 'weekly':
      return `Weekly target: ${habit()}`;
    case 'wake':
      return 'Wake time';
    case 'bed':
      return 'Bedtime';
    case 'priority':
      return `Top priority: ${data.settings.workStreams.find((w) => w.id === e.ref)?.name || 'Deleted work stream'}`;
    case 'resisted':
      return `Resisted: ${badHabit(e.ref)}`;
    case 'clean':
      return `Clean day: ${badHabit(e.ref)}`;
    case 'comeback':
      return `Comeback: ${badHabit(e.ref)}`;
    case 'boss': {
      const [id, round] = e.ref.split('#');
      return `Boss defeated: ${badHabit(id)} (round ${round})`;
    }
    case 'combo':
      return `Combo: ${TIMES_OF_DAY.find((t) => t.id === e.ref)?.label ?? 'Group'} cleared`;
    case 'quest':
      return `Quest: ${questTitle(data, e.ref)}`;
    case 'chest':
      return 'Daily chest';
    case 'purchase':
      return `Bought: ${e.label || 'Reward'}`;
  }
}

function Stat({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${accent ? 'text-accent' : ''}`}>{value}</p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
      <div className={`h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}
