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

/** A whole-number box. Empty or invalid input keeps the last good value. */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  ariaLabel,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => {
          const n = Math.round(Number(e.target.value));
          if (e.target.value !== '' && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className={`${inputClass} tabular-nums ${suffix ? 'pr-12' : ''}`}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  compact,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
  /** Smaller text and padding, for 3–4 options on a phone. */
  compact?: boolean;
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
          className={`flex-1 rounded-lg py-1.5 font-semibold transition-colors ${compact ? 'px-1 text-xs' : 'px-3 text-sm'} ${
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
      // Same 1px border in both states, so the knob doesn't shift. Inside it the track is 46×26px.
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${on ? 'border-transparent bg-accent' : 'border-line bg-surface-2'}`}
    >
      {/* Pinned to the track's left edge, then slid 3px (off) or 23px (on): a 3px gap on every side. */}
      <span
        className={`absolute left-0 top-[3px] h-5 w-5 rounded-full bg-text transition-transform ${on ? 'translate-x-[23px]' : 'translate-x-[3px]'}`}
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
