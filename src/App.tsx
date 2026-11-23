import { useCallback, useState } from 'react';
import { useAppData } from './lib/storage';
import { newId } from './lib/id';
import { Today } from './screens/Today';
import { Setup } from './screens/Setup';
import { SettingsScreen } from './screens/SettingsScreen';
import { Inbox } from './screens/Inbox';
import { MoreMenu, SubPageHeader, type MorePage } from './screens/More';
import { CaptureButton, CaptureSheet } from './components/QuickCapture';
import { Progress } from './screens/Progress';
import { Celebrations } from './components/Celebrations';
import { useGameEvents } from './lib/useGameEvents';

/** Bottom tabs. Health, Goals and Money join in later stages (never more than 5). */
type Tab = 'today' | 'more';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'M5 12.5l4.5 4.5L19 7.5' },
  { id: 'more', label: 'More', icon: 'M5 12h.01M12 12h.01M19 12h.01' },
];

const pageTitles: Record<MorePage, string> = { progress: 'Progress', inbox: 'Inbox', settings: 'Settings' };

export default function App() {
  const [data, update] = useAppData();
  const [tab, setTab] = useState<Tab>('today');
  const [morePage, setMorePage] = useState<MorePage | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const closeCapture = useCallback(() => setCaptureOpen(false), []);
  const [celebrations, celebrationDone] = useGameEvents(data, update);

  if (!data.setupDone) {
    return (
      <Setup
        initial={data.settings}
        onFinish={(settings) => {
          update((d) => ({ ...d, settings, setupDone: true }));
          setTab('today');
          setMorePage(null);
        }}
      />
    );
  }

  const go = (t: Tab, page: MorePage | null = null) => {
    setTab(t);
    setMorePage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <main className="flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {tab === 'today' && (
          <Today data={data} update={update} onOpenSettings={() => go('more', 'settings')} onOpenProgress={() => go('more', 'progress')} />
        )}
        {tab === 'more' && !morePage && <MoreMenu data={data} onOpen={(p) => go('more', p)} />}
        {tab === 'more' && morePage && (
          <div className="space-y-6">
            <SubPageHeader title={pageTitles[morePage]} onBack={() => go('more')} />
            {morePage === 'progress' && <Progress data={data} />}
            {morePage === 'inbox' && <Inbox data={data} update={update} />}
            {morePage === 'settings' && <SettingsScreen data={data} update={update} />}
          </div>
        )}
      </main>

      <Celebrations queue={celebrations} onDone={celebrationDone} />

      <CaptureSheet
        open={captureOpen}
        onClose={closeCapture}
        onSave={(text, tag) =>
          update((d) => ({ ...d, inbox: [{ id: newId(), text, tag, createdAt: new Date().toISOString(), done: false }, ...d.inbox] }))
        }
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="Main"
      >
        {/* The + capture button sits in the middle, with the tabs split either side. */}
        <ul className="mx-auto flex max-w-lg items-start">
          {[...tabs.slice(0, Math.ceil(tabs.length / 2)), null, ...tabs.slice(Math.ceil(tabs.length / 2))].map((t) =>
            t === null ? (
              <li key="capture" className="flex flex-1 justify-center">
                <CaptureButton onClick={() => setCaptureOpen(true)} />
              </li>
            ) : (
            <li key={t.id} className="flex-1">
              <button
                type="button"
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  tab === t.id ? 'text-accent' : 'text-muted'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={t.id === 'more' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
                {t.label}
              </button>
            </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}
