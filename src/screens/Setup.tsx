import { useState, type ComponentType } from 'react';
import type { Settings } from '../lib/types';
import { blankHabit } from '../lib/defaults';
import { DayWeekEditor, GymEditor, HabitsEditor, SleepEditor, WorkStreamsEditor, type EditorProps } from '../components/editors';

/** Drops rows left blank and trims names, so half-filled entries never reach Today. */
export function cleanSettings(s: Settings): Settings {
  return {
    ...s,
    habits: s.habits
      .map((h) => ({ ...h, name: h.name.trim(), fullLabel: h.fullLabel?.trim(), minLabel: h.minLabel?.trim() }))
      // The wizard doesn't ask for the gym's life area: it's always Health (changeable later in Settings).
      .map((h) => (h.gym ? { ...h, areaId: 'health' } : h))
      .filter((h) => h.name),
    workStreams: s.workStreams.map((w) => ({ ...w, name: w.name.trim() })).filter((w) => w.name),
  };
}

const steps: { title: string; intro: string; Editor?: ComponentType<EditorProps> }[] = [
  {
    title: 'Welcome',
    intro:
      "Let's set up your tracker. It takes about two minutes, and you can change everything later in Settings. What you enter is saved only on this device. There's no account and nothing is sent anywhere.",
  },
  {
    title: 'Your daily habits',
    intro:
      'Add the habits you want to tick off. A Full / Minimum habit has a proper version and a bare-minimum version for hard days. Yes / No suits simple check-ins. Give each one a life area, a time of day and how often it’s due.',
    Editor: HabitsEditor,
  },
  {
    title: 'Gym',
    intro: 'Pick set gym days, or a number of sessions a week that you can fit in on any day.',
    Editor: (props) => <GymEditor {...props} showArea={false} />,
  },
  {
    title: 'Sleep',
    intro: 'Tap "Woke up" and "Going to bed" each day to log the time. On or before these times earns the full version.',
    Editor: SleepEditor,
  },
  {
    title: 'Work streams',
    intro: "Each work stream gets one top priority a day, which you type in the morning and tick when it's done.",
    Editor: WorkStreamsEditor,
  },
  {
    title: 'Your day and week',
    intro: 'A late night still counts as the same day until your day resets.',
    Editor: DayWeekEditor,
  },
];

export function Setup({ initial, onFinish }: { initial: Settings; onFinish: (s: Settings) => void }) {
  const [step, setStep] = useState(0);
  // Start with one empty habit row so the first habit is ready to type.
  const [draft, setDraft] = useState<Settings>(() =>
    initial.habits.some((h) => !h.gym) ? initial : { ...initial, habits: [blankHabit(), ...initial.habits] },
  );

  const { title, intro, Editor } = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-6 flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-surface-2'}`} />
        ))}
      </div>

      <p className="text-sm font-semibold uppercase tracking-widest text-accent">
        Step {step + 1} of {steps.length}
      </p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{intro}</p>

      <div className="mt-6 flex-1">{Editor && <Editor settings={draft} onChange={(fn) => setDraft(fn)} />}</div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 bg-bg/90 px-4 py-3 backdrop-blur">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="rounded-full border border-line px-5 py-3 font-semibold text-muted hover:text-text"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            window.scrollTo(0, 0);
            if (last) onFinish(cleanSettings(draft));
            else setStep(step + 1);
          }}
          className="flex-1 rounded-full bg-accent py-3 font-bold text-bg active:scale-[0.98]"
        >
          {step === 0 ? "Let's go" : last ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
