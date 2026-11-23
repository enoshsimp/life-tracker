import type { ReactNode } from 'react';
import type { AppData, Settings } from '../lib/types';
import { createDefaultData } from '../lib/defaults';
import { AreasEditor, DayWeekEditor, GymEditor, HabitsEditor, PointsEditor, SleepEditor, WorkStreamsEditor } from '../components/editors';

/** Every personal value, editable. Changes save and apply to Today straight away. */
export function SettingsScreen({ data, update }: { data: AppData; update: (fn: (d: AppData) => AppData) => void }) {
  const onChange = (fn: (s: Settings) => Settings) => update((d) => ({ ...d, settings: fn(d.settings) }));
  const props = { settings: data.settings, onChange };

  function eraseAll() {
    const ok = window.confirm(
      'Erase everything on this device (settings, ticks and history) and run setup again?\n\nThis cannot be undone.',
    );
    if (ok) update(() => createDefaultData());
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">Changes save automatically and only live on this device.</p>

      <Section title="Habits">
        <HabitsEditor {...props} />
      </Section>
      <Section title="Life areas">
        <AreasEditor {...props} />
      </Section>
      <Section title="Gym">
        <GymEditor {...props} />
      </Section>
      <Section title="Sleep">
        <SleepEditor {...props} />
      </Section>
      <Section title="Work streams">
        <WorkStreamsEditor {...props} />
      </Section>
      <Section title="Points and bonuses">
        <PointsEditor {...props} />
      </Section>
      <Section title="Day and week">
        <DayWeekEditor {...props} />
      </Section>

      <Section title="Data">
        <div className="rounded-2xl border border-red-500/30 bg-surface p-4">
          <p className="font-semibold">Erase all data</p>
          <p className="mt-1 text-xs text-muted">Deletes everything on this device and shows the setup wizard again.</p>
          <button
            type="button"
            onClick={eraseAll}
            className="mt-3 rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            Erase and start over
          </button>
        </div>
      </Section>
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
