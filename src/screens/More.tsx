import type { AppData } from '../lib/types';

export type MorePage = 'inbox' | 'settings';

/** The More tab's menu. Later stages add Reviews, Shop, Reading and Stats here. */
export function MoreMenu({ data, onOpen }: { data: AppData; onOpen: (page: MorePage) => void }) {
  const openCount = data.inbox.filter((i) => !i.done).length;
  const items: { id: MorePage; label: string; hint: string; badge?: number; icon: string }[] = [
    { id: 'inbox', label: 'Inbox', hint: 'Your quick captures', badge: openCount, icon: 'M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5' },
    { id: 'settings', label: 'Settings', hint: 'Habits, life areas, targets', icon: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3' },
  ];

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="text-3xl font-black tracking-tight">More</h1>
      </header>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onOpen(it.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left hover:border-accent"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={it.icon} />
              </svg>
              <span className="flex-1">
                <span className="block font-semibold">{it.label}</span>
                <span className="block text-xs text-muted">{it.hint}</span>
              </span>
              {!!it.badge && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold tabular-nums text-bg">{it.badge}</span>
              )}
              <span className="text-muted" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Header with a back button, for pages opened from More. */
export function SubPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-2 pt-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to More"
        className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
    </header>
  );
}
