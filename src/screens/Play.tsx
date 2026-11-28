import type { AppData } from '../lib/types';
import { overallLevel, totalXp } from '../lib/game';
import { allBosses, describeReduce, type BossState } from '../lib/bosses';
import { appDayKey, getNow, parseKey } from '../lib/day';
import { TrophyIcon } from '../components/Celebrations';

/** Each round's boss looks a little different. */
const ROUND_COLOURS = ['#f87171', '#c084fc', '#fb923c', '#38bdf8', '#f472b6', '#facc15'];

/** The Play tab: a boss for each bad habit, and the trophies you've won. Quests, the chest and the character sheet come in Stage 8. */
export function Play({ data, onOpenSettings }: { data: AppData; onOpenSettings: () => void }) {
  const level = overallLevel(totalXp(data));
  const todayKey = appDayKey(getNow(), data.settings.dayStartHour);
  const bosses = allBosses(data, todayKey);
  const trophies = bosses.flatMap((b) => b.trophies.map((t) => ({ ...t, name: b.habit.name }))).sort((a, b) => (a.day < b.day ? 1 : -1));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between pt-2">
        <h1 className="text-3xl font-black tracking-tight">Play</h1>
        <span className="rounded-lg bg-accent px-2 py-0.5 text-sm font-black tabular-nums text-bg">Lv {level.level}</span>
      </header>

      <section>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">Bosses</h2>
        {bosses.length === 0 ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full rounded-3xl border border-dashed border-line p-6 text-center hover:border-accent"
          >
            <BossFace colour={ROUND_COLOURS[0]} className="mx-auto h-16 w-16 opacity-60" />
            <p className="mt-3 font-bold">No bosses yet</p>
            <p className="mt-1 text-sm text-muted">Add a bad habit you want to quit or cut down, and it becomes a boss. Every clean day hits it.</p>
            <p className="mt-3 text-sm font-semibold text-accent">Add one in Settings →</p>
          </button>
        ) : (
          <ul className="space-y-3">
            {bosses.map((b) => (
              <BossCard key={b.habit.id} boss={b} />
            ))}
          </ul>
        )}
      </section>

      {trophies.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">Trophies ({trophies.length})</h2>
          <ul className="grid grid-cols-2 gap-2">
            {trophies.map((t) => (
              <li key={`${t.name}-${t.round}-${t.day}`} className="rounded-2xl border border-min/40 bg-surface p-3">
                <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-min text-bg">
                  <TrophyIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted">Round {t.round} defeated</p>
                <p className="mt-1 text-[11px] text-min">{parseKey(t.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        Coming next: daily quests, a daily chest and your character sheet.
      </p>
    </div>
  );
}

function BossCard({ boss }: { boss: BossState }) {
  const { habit, round, hp, maxHp, cleanStreak, bestStreak, todayExcess } = boss;
  const colour = ROUND_COLOURS[(round - 1) % ROUND_COLOURS.length];
  const pct = hp / maxHp;
  return (
    <li className="overflow-hidden rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center gap-4">
        <BossFace colour={colour} angry={todayExcess > 0} className={`h-16 w-16 shrink-0 ${todayExcess > 0 ? '' : 'animate-boss-bob'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-lg font-black">{habit.name}</p>
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: colour }}>
              Round {round}
            </span>
          </div>
          <p className="text-xs text-muted">{describeReduce(habit)}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2" role="meter" aria-label={`${habit.name} boss HP`} aria-valuenow={hp} aria-valuemin={0} aria-valuemax={maxHp}>
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct * 100}%`, background: colour }} />
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums">
              {hp}/{maxHp} HP
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Mini label="Clean streak" value={cleanStreak} />
        <Mini label="Best" value={bestStreak} />
        <Mini label="Today" value={todayExcess > 0 ? 'Slipped' : 'Clean'} bad={todayExcess > 0} />
      </div>
      <p className="mt-3 text-xs text-muted">
        {hp === 1 ? 'One more clean day finishes it!' : `${hp} more clean days to win this round.`} Today counts once it's over.
      </p>
    </li>
  );
}

function Mini({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-2 px-2 py-1.5">
      <p className={`text-base font-black tabular-nums ${bad ? 'text-red-400' : ''}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

/** A friendly blob monster. It frowns on a day you slipped. */
function BossFace({ colour, angry, className }: { colour: string; angry?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M12 52c-4 0-6-4-5-9 1-6 0-13 3-20C14 12 22 6 32 6s18 6 22 17c3 7 2 14 3 20 1 5-1 9-5 9-3 0-4-3-7-3s-4 3-7 3-4-3-6-3-3 3-6 3-4-3-7-3-4 3-7 3z" fill={colour} />
      <path d="M18 10l4 7M46 10l-4 7" stroke={colour} strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="28" r="6" fill="#fff" />
      <circle cx="40" cy="28" r="6" fill="#fff" />
      <circle cx="25" cy="29" r="3" fill="#0b0d12" />
      <circle cx="39" cy="29" r="3" fill="#0b0d12" />
      {angry ? (
        <>
          <path d="M17 20l12 4M47 20l-12 4" stroke="#0b0d12" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 44q8-6 16 0" stroke="#0b0d12" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <path d="M24 40q8 6 16 0" stroke="#0b0d12" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
