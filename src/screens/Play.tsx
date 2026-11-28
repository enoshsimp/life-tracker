import type { AppData, ChestReward } from '../lib/types';
import { areaLevel, areaXp, balance, computeStreak, overallLevel, totalXp } from '../lib/game';
import { questsFor } from '../lib/quests';
import { ALL_COSMETICS } from '../lib/cosmetics';
import { QuestStrip } from '../components/Quests';
import { allBosses, describeReduce, type BossState } from '../lib/bosses';
import { appDayKey, getNow, parseKey } from '../lib/day';
import { TrophyIcon } from '../components/Celebrations';

/** Each round's boss looks a little different. */
const ROUND_COLOURS = ['#f87171', '#c084fc', '#fb923c', '#38bdf8', '#f472b6', '#facc15'];

/** The Play tab: your character sheet, today's quests and chest, a boss for each bad habit, and your trophies. */
export function Play({ data, onOpenSettings }: { data: AppData; onOpenSettings: () => void }) {
  const level = overallLevel(totalXp(data));
  const todayKey = appDayKey(getNow(), data.settings.dayStartHour);
  const bosses = allBosses(data, todayKey);
  const trophies = bosses.flatMap((b) => b.trophies.map((t) => ({ ...t, name: b.habit.name }))).sort((a, b) => (a.day < b.day ? 1 : -1));

  const perArea = areaXp(data);
  const quests = questsFor(data, todayKey);
  const chest = data.chests[todayKey];
  const streak = computeStreak(data, parseKey(todayKey));
  const r = 42;
  const circ = 2 * Math.PI * r;

  return (
    <div className="space-y-8">
      <header className="pt-2">
        <h1 className="text-3xl font-black tracking-tight">Play</h1>
      </header>

      {/* Character sheet: overall level, and each life area as a stat. */}
      <section className="rounded-3xl border border-line bg-surface p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
              <circle
                className="ring-arc"
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - level.into / level.need)}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center leading-none">
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">Level</span>
                <span className="block text-4xl font-black tabular-nums text-accent">{level.level}</span>
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5 text-sm">
            <p className="text-xs text-muted">
              <span className="font-bold tabular-nums text-text">{level.into}</span>/{level.need} XP to level {level.level + 1}
            </p>
            <p>
              <span className="font-black tabular-nums text-min">{balance(data)}</span> <span className="text-muted">points to spend</span>
            </p>
            <p>
              <span className="font-black tabular-nums">{streak.current}</span> <span className="text-muted">day streak</span>
              {streak.banked > 0 && <span className="text-sky-400"> · {streak.banked} spare shield{streak.banked > 1 ? 's' : ''}</span>}
            </p>
            <p>
              <span className="font-black tabular-nums">{Object.keys(data.achievements).length}</span>
              <span className="text-muted"> badges · </span>
              <span className="font-black tabular-nums">{trophies.length}</span>
              <span className="text-muted"> trophies</span>
            </p>
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
          {data.settings.areas.map((a, i) => {
            const info = areaLevel(perArea[a.id] ?? 0);
            return (
              <li key={a.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-bold uppercase tracking-wide">{a.name.trim() || `Area ${i + 1}`}</span>
                  <span className="shrink-0 font-black tabular-nums text-full">{info.level}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-full transition-[width] duration-500" style={{ width: `${(info.into / info.need) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {quests.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">Today</h2>
          <QuestStrip quests={quests} chestOpen={!!chest} />
          <p className="mt-2 px-1 text-xs text-muted">
            {data.settings.game.quest} XP per quest, {data.settings.game.questAll} extra for all three. New quests every day.
            {chest ? ` Today's chest gave ${describeChest(chest)}.` : ' Finish the day or the evening check-in to open the daily chest.'}
          </p>
        </section>
      )}

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

    </div>
  );
}

/** "20 XP", "a streak shield", "the Ocean theme"… */
function describeChest(c: ChestReward): string {
  if (c.type === 'xp') return `${c.amount} XP${c.jackpot ? ' (jackpot!)' : ''}`;
  if (c.type === 'shield') return 'a streak shield';
  const look = ALL_COSMETICS.find((x) => x.id === c.id);
  return look ? `the ${look.name} ${look.kind === 'theme' ? 'theme' : 'badge style'}` : 'a new look';
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
