import { useState, type ReactNode } from 'react';
import { buzz } from '../lib/feedback';

interface Props {
  active: boolean;
  tone: 'full' | 'min';
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const toneStyles = {
  full: { on: 'bg-full text-bg border-full', ring: 'text-full' },
  min: { on: 'bg-min text-bg border-min', ring: 'text-min' },
};

/** A pill button that pops, bursts and vibrates when switched on. */
export function TickButton({ active, tone, onToggle, children, className = '', ariaLabel }: Props) {
  const [burst, setBurst] = useState(0);

  function handle() {
    if (!active) {
      setBurst((n) => n + 1);
      buzz(tone);
    } else {
      buzz('undo');
    }
    onToggle();
  }

  const styles = toneStyles[tone];
  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`relative rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
        active ? styles.on : 'border-line bg-surface-2 text-muted hover:text-text'
      } ${className}`}
    >
      {/* Remounting on each tick replays the animation. */}
      <span key={burst} className={`flex items-center justify-center gap-1.5 ${burst && active ? 'animate-pop' : ''}`}>
        {active && <CheckIcon />}
        {children}
      </span>
      {burst > 0 && active && <span key={`r${burst}`} className={`burst-ring ${styles.ring}`} />}
    </button>
  );
}

export function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
