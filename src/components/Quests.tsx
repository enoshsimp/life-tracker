import type { Quest } from '../lib/quests';
import { CheckIcon } from './TickButton';
import { ChestIcon } from './Celebrations';

/** One quest line: a tick circle and its title. */
function QuestLine({ q }: { q: Quest }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${q.done ? 'border-full bg-full text-bg' : 'border-line'}`}
        aria-hidden
      >
        {q.done && <CheckIcon className="h-3 w-3" />}
      </span>
      <span className={`min-w-0 truncate text-sm ${q.done ? 'text-muted line-through' : 'font-semibold'}`}>{q.title}</span>
      <span className="sr-only">{q.done ? 'done' : 'not done yet'}</span>
    </li>
  );
}

/** Today's quests in a small card, plus whether today's chest is open. They tick themselves as you log. */
export function QuestStrip({ quests, chestOpen }: { quests: Quest[]; chestOpen: boolean }) {
  if (!quests.length) return null;
  const done = quests.filter((q) => q.done).length;
  return (
    <section className="rounded-2xl border border-line bg-surface p-4" aria-label="Today's quests">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          Quests <span className={`tabular-nums ${done === quests.length ? 'text-full' : 'text-text'}`}>{done}/{quests.length}</span>
        </p>
        <span className={`flex items-center gap-1 text-xs font-semibold ${chestOpen ? 'text-min' : 'text-muted'}`}>
          <ChestIcon className="h-4 w-4" />
          {chestOpen ? 'Chest opened' : 'Chest: finish the day'}
        </span>
      </div>
      <ul className="space-y-2">
        {quests.map((q) => (
          <QuestLine key={q.id} q={q} />
        ))}
      </ul>
    </section>
  );
}
