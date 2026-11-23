import type { ReactNode } from 'react';

export const inputClass =
  'w-full min-w-0 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-base outline-none placeholder:text-muted/70 focus:border-accent';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={inputClass}
    />
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex rounded-xl border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            value === o.value ? 'bg-accent text-bg' : 'text-muted hover:text-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Weekday numbers (0 = Sunday) in the order the user's week runs. */
export function weekOrder(weekStartsOn: 0 | 1): number[] {
  return weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
}

export function DayPicker({
  days,
  onChange,
  weekStartsOn,
}: {
  days: number[];
  onChange: (days: number[]) => void;
  weekStartsOn: 0 | 1;
}) {
  const toggle = (d: number) =>
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b));
  return (
    <div className="flex gap-1.5">
      {weekOrder(weekStartsOn).map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={days.includes(d)}
          onClick={() => toggle(d)}
          className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-colors ${
            days.includes(d) ? 'border-accent bg-accent text-bg' : 'border-line bg-surface-2 text-muted'
          }`}
        >
          {DAY_NAMES[d]}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-surface-2 border border-line'}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-text transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export function IconButton({
  onClick,
  label,
  children,
  disabled,
  danger,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors disabled:opacity-25 ${
        danger ? 'hover:bg-red-500/15 hover:text-red-400' : 'hover:bg-surface-2 hover:text-text'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-dashed border-line py-3 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
    >
      + {children}
    </button>
  );
}
