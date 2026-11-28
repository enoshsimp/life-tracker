/** The tick mark, drawn on with a short animation. */
export function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
