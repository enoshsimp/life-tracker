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
import { Play } from './screens/Play';
import { Celebrations } from './components/Celebrations';
import { useGameEvents } from './lib/useGameEvents';
import { UpdatePrompt } from './components/UpdatePrompt';
import type { AppData } from './lib/types';

/** Bottom tabs (never more than 5). */
type Tab = 'today' | 'play' | 'more';

interface TabInfo {
  id: Tab;
  label: string;
  icon: string;
}

/** Tabs either side of the + button, which always sits in the middle of the bar. */
const leftTabs: TabInfo[] = [
  { id: 'today', label: 'Today', icon: 'M5 12.5l4.5 4.5L19 7.5' },
  { id: 'play', label: 'Play', icon: 'M6 9h4M8 7v4M15 10h.01M18 8h.01M7 4h10a5 5 0 015 5v3a5 5 0 01-9 3h-2a5 5 0 01-9-3V9a5 5 0 015-5z' },
];
const rightTabs: TabInfo[] = [{ id: 'more', label: 'More', icon: 'M5 12h.01M12 12h.01M19 12h.01' }];

const pageTitles: Record<MorePage, string> = { progress: 'Progress', inbox: 'Inbox', settings: 'Settings' };

export default function App() {
  const [data, update] = useAppData();
  const [tab, setTab] = useState<Tab>('today');
  const [morePage, setMorePage] = useState<MorePage | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const closeCapture = useCallback(() => setCaptureOpen(false), []);
  // Goes up when the whole data set is replaced (restore or erase), so it isn't celebrated as new progress.
  const [dataEpoch, setDataEpoch] = useState(0);
  const replaceData = (next: AppData) => {
    update(() => next);
    setDataEpoch((e) => e + 1);
  };
  const [celebrations, celebrationDone] = useGameEvents(data, update, dataEpoch);

  if (!data.setupDone) {
    return (
      <>
        <Setup
          initial={data.settings}
          onFinish={(settings) => {
            update((d) => ({ ...d, settings, setupDone: true }));
            setTab('today');
            setMorePage(null);
          }}
          onRestore={(d) => {
            replaceData(d);
            setTab('today');
            setMorePage(null);
          }}
        />
        <UpdatePrompt />
      </>
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
        {tab === 'play' && <Play data={data} />}
        {tab === 'more' && !morePage && <MoreMenu data={data} onOpen={(p) => go('more', p)} />}
        {tab === 'more' && morePage && (
          <div className="space-y-6">
            <SubPageHeader title={pageTitles[morePage]} onBack={() => go('more')} />
            {morePage === 'progress' && <Progress data={data} />}
            {morePage === 'inbox' && <Inbox data={data} update={update} />}
            {morePage === 'settings' && <SettingsScreen data={data} update={update} replaceData={replaceData} />}
          </div>
        )}
      </main>

      <Celebrations queue={celebrations} onDone={celebrationDone} />
      <UpdatePrompt />

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
        <div className="mx-auto flex max-w-lg items-start">
          <TabList tabs={leftTabs} current={tab} onGo={go} />
          <div className="flex w-20 justify-center">
            <CaptureButton onClick={() => setCaptureOpen(true)} />
          </div>
          <TabList tabs={rightTabs} current={tab} onGo={go} />
        </div>
      </nav>
    </div>
  );
}

function TabList({ tabs, current, onGo }: { tabs: TabInfo[]; current: Tab; onGo: (t: Tab) => void }) {
  return (
    <ul className="flex flex-1">
      {tabs.map((t) => (
        <li key={t.id} className="flex-1">
          <button
            type="button"
            onClick={() => onGo(t.id)}
            aria-current={current === t.id ? 'page' : undefined}
            className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${current === t.id ? 'text-accent' : 'text-muted'}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={t.id === 'more' ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
