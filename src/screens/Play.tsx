import type { AppData } from '../lib/types';
import { overallLevel, totalXp } from '../lib/game';

/** The Play tab. Bosses arrive in Stage 7; quests, the chest and the character screen in Stage 8. */
export function Play({ data }: { data: AppData }) {
  const level = overallLevel(totalXp(data));
  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="text-3xl font-black tracking-tight">Play</h1>
      </header>
      <div className="rounded-3xl border border-line bg-surface p-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent text-bg">
          <span className="text-center leading-none">
            <span className="block text-[10px] font-bold uppercase">Lv</span>
            <span className="block text-2xl font-black tabular-nums">{level.level}</span>
          </span>
        </div>
        <p className="mt-4 text-xl font-black">Coming soon</p>
        <p className="mt-2 text-sm text-muted">
          Bosses for the habits you want to cut down, daily quests, a daily chest and your character sheet will live here.
        </p>
      </div>
    </div>
  );
}
