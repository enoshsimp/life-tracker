import { useState } from 'react';
import { useAppData } from './lib/storage';
import { Today } from './screens/Today';
import { Setup } from './screens/Setup';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'today' | 'body' | 'work' | 'shop' | 'settings';

const tabs: { id: Tab; label: string; icon: string; ready: boolean }[] = [
  { id: 'today', label: 'Today', icon: 'M5 12.5l4.5 4.5L19 7.5', ready: true },
  { id: 'body', label: 'Body', icon: 'M4 18l5-6 4 3 7-9', ready: false },
  { id: 'work', label: 'Work', icon: 'M4 8h16v11H4zM9 8V5h6v3', ready: false },
  { id: 'shop', label: 'Shop', icon: 'M5 9h14l-1 11H6zM9 9a3 3 0 016 0', ready: false },
  { id: 'settings', label: 'Settings', icon: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3', ready: true },
];

export default function App() {
  const [data, update] = useAppData();
  const [tab, setTab] = useState<Tab>('today');

  if (!data.setupDone) {
    return (
      <Setup
        initial={data.settings}
        onFinish={(settings) => {
          update((d) => ({ ...d, settings, setupDone: true }));
          setTab('today');
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {tab === 'today' && <Today data={data} update={update} onOpenSettings={() => setTab('settings')} />}
        {tab === 'settings' && <SettingsScreen data={data} update={update} />}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-lg">
          {tabs.map((t) => (
            <li key={t.id} className="flex-1">
              <button
                type="button"
                disabled={!t.ready}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                title={t.ready ? t.label : `${t.label} (coming soon)`}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold disabled:cursor-default disabled:opacity-30 ${
                  tab === t.id ? 'text-accent' : 'text-muted'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
