import { useState } from 'react';
import type { AppData, CaptureTag, InboxItem } from '../lib/types';
import { CAPTURE_TAGS, tagInfo } from '../lib/capture';
import { buzz } from '../lib/feedback';
import { CheckIcon } from '../components/TickButton';
import { IconButton } from '../components/ui';

type Filter = CaptureTag | 'all' | 'untagged';

export function Inbox({ data, update }: { data: AppData; update: (fn: (d: AppData) => AppData) => void }) {
  const [filter, setFilter] = useState<Filter>('all');

  const matches = (i: InboxItem) => filter === 'all' || (filter === 'untagged' ? !i.tag : i.tag === filter);
  const open = data.inbox.filter((i) => !i.done && matches(i));
  const done = data.inbox.filter((i) => i.done && matches(i));

  const setInbox = (fn: (l: InboxItem[]) => InboxItem[]) => update((d) => ({ ...d, inbox: fn(d.inbox) }));
  const toggle = (item: InboxItem) => {
    buzz(item.done ? 'undo' : 'min');
    setInbox((l) => l.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)));
  };
  const remove = (id: string) => setInbox((l) => l.filter((x) => x.id !== id));

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...CAPTURE_TAGS.map((t) => ({ id: t.id as Filter, label: t.label })),
    { id: 'untagged', label: 'No tag' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Everything you capture with the + button lands here.</p>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === f.id ? 'border-accent bg-accent text-bg' : 'border-line text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {open.length === 0 && done.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          {data.inbox.length === 0 ? 'Nothing captured yet. Tap + to add your first thought.' : 'Nothing here with this tag.'}
        </p>
      )}

      <ul className="space-y-2">
        {open.map((i) => (
          <Item key={i.id} item={i} onToggle={() => toggle(i)} onDelete={() => remove(i.id)} />
        ))}
      </ul>

      {done.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted">Done ({done.length})</h2>
          <ul className="space-y-2 opacity-60">
            {done.map((i) => (
              <Item key={i.id} item={i} onToggle={() => toggle(i)} onDelete={() => remove(i.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Item({ item, onToggle, onDelete }: { item: InboxItem; onToggle: () => void; onDelete: () => void }) {
  const tag = item.tag ? tagInfo(item.tag) : undefined;
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={item.done}
        aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${
          item.done ? 'border-full bg-full text-bg' : 'border-line'
        }`}
      >
        {item.done && <CheckIcon />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`break-words ${item.done ? 'line-through' : ''}`}>{item.text}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted">
          {tag && <span className={`rounded-full border px-2 py-0.5 font-semibold ${tag.className}`}>{tag.label}</span>}
          {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </p>
      </div>
      <IconButton label="Delete" danger onClick={onDelete}>
        <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
      </IconButton>
    </li>
  );
}
