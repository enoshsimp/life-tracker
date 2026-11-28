import { useEffect, useRef, type CSSProperties } from 'react';
import { buzz } from '../lib/feedback';
import type { ChestReward } from '../lib/types';
import { ALL_COSMETICS, useBadgeStyle } from '../lib/cosmetics';

/** Calls `onDone` once after `ms`, even if the parent re-renders meanwhile. */
function useAutoClose(onDone: () => void, ms: number, onStart?: () => void) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    onStart?.();
    const id = window.setTimeout(() => done.current(), ms);
    return () => window.clearTimeout(id);
    // Runs once per celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Something worth celebrating. Small ones show as pills; big ones as a card in the middle of the screen. */
export type Fx =
  | { id: string; type: 'points'; amount: number; bonus?: boolean; note?: string; combo?: boolean }
  | { id: string; type: 'chest'; reward: ChestReward }
  | { id: string; type: 'area'; name: string; level: number }
  | { id: string; type: 'boss-hit'; name: string; damage: number; xp: number }
  | { id: string; type: 'boss-heal'; name: string; heal: number }
  | { id: string; type: 'level'; level: number }
  | { id: string; type: 'badge'; name: string; description: string }
  | { id: string; type: 'boss-defeated'; name: string; round: number };

const isBig = (f: Fx) => f.type === 'level' || f.type === 'badge' || f.type === 'boss-defeated' || f.type === 'chest';

const CONFETTI_COLOURS = ['var(--color-accent)', 'var(--color-full)', 'var(--color-min)', '#f472b6', '#38bdf8'];

function Pill({ fx, onDone }: { fx: Fx; onDone: () => void }) {
  useAutoClose(onDone, 1600, () => fx.type === 'points' && fx.combo && buzz('combo'));

  if (fx.type === 'points') {
    return (
      <span
        className={`animate-float-up rounded-full px-4 py-1.5 text-sm font-black tabular-nums shadow-lg ${
          fx.bonus ? 'animate-shimmer bg-min text-bg' : fx.combo ? 'animate-shimmer bg-accent text-bg' : 'bg-surface-2 text-full'
        }`}
      >
        +{fx.amount}
        {fx.bonus && ' · 2× BONUS!'}
        {fx.note && ` · ${fx.note}`}
      </span>
    );
  }
  if (fx.type === 'boss-hit') {
    return (
      <span className="animate-float-up flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-sm font-black text-white shadow-lg">
        <SwordIcon className="h-4 w-4" />
        {fx.name} −{fx.damage} HP
        {fx.xp > 0 && <span className="tabular-nums opacity-90">· +{fx.xp}</span>}
      </span>
    );
  }
  if (fx.type === 'boss-heal') {
    return (
      <span className="animate-float-up rounded-full bg-surface-2 px-4 py-1.5 text-sm font-bold text-red-300 shadow-lg">
        {fx.name} healed +{fx.heal} HP
      </span>
    );
  }
  if (fx.type === 'area') {
    return (
      <span className="animate-float-up rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-bg shadow-lg">
        {fx.name} reached level {fx.level}
      </span>
    );
  }
  return null;
}

function BigCard({ fx, onDone }: { fx: Fx; onDone: () => void }) {
  useAutoClose(onDone, fx.type === 'chest' ? 4200 : 3200, () => buzz(fx.type === 'chest' ? 'chest' : 'celebrate'));

  const pieces = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const dist = 120 + (i % 4) * 30;
    return {
      key: i,
      style: {
        background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
        '--dx': `${Math.cos(angle) * dist}px`,
        '--dy': `${Math.sin(angle) * dist}px`,
        animationDelay: `${(i % 3) * 60}ms`,
      } as CSSProperties,
    };
  });

  return (
    // overflow-hidden keeps the confetti on screen, so a phone never zooms out to fit it.
    <div className="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-black/60 p-6" onClick={onDone} role="alertdialog" aria-live="assertive">
      <div className="relative">
        {pieces.map((p) => (
          <span key={p.key} className="confetti-piece" style={p.style} />
        ))}
        <div className="animate-zoom-in relative w-64 rounded-3xl border border-accent/50 bg-surface p-6 text-center shadow-2xl">
          {fx.type === 'level' ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Level up!</p>
              <p className="mt-2 text-7xl font-black tabular-nums">{fx.level}</p>
              <p className="mt-2 text-sm text-muted">Keep going.</p>
            </>
          ) : fx.type === 'badge' ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-min">Badge unlocked</p>
              <div className="mx-auto mt-3 grid h-16 w-16 place-items-center rounded-full bg-min text-bg">
                <BadgeIcon className="h-9 w-9" />
              </div>
              <p className="mt-3 text-xl font-black">{fx.name}</p>
              <p className="mt-1 text-sm text-muted">{fx.description}</p>
            </>
          ) : fx.type === 'chest' ? (
            <ChestContents reward={fx.reward} />
          ) : fx.type === 'boss-defeated' ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400">Boss defeated!</p>
              <div className="mx-auto mt-3 grid h-16 w-16 place-items-center rounded-full bg-min text-bg">
                <TrophyIcon className="h-9 w-9" />
              </div>
              <p className="mt-3 text-xl font-black">{fx.name}</p>
              <p className="mt-1 text-sm text-muted">Round {fx.round} is a trophy now. Round {fx.round + 1} starts today.</p>
            </>
          ) : null}
          <p className="mt-4 text-[11px] text-muted">Tap to close</p>
        </div>
      </div>
    </div>
  );
}

/** Badge shapes, one per badge style. */
const BADGE_PATHS: Record<string, string> = {
  star: 'M12 2l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 15.4 6.7 18.4l1.2-6L3.4 8.3l6-.7L12 2z',
  shield: 'M12 2l8 3.5v6c0 5-3.5 9-8 10.5C7.5 20.5 4 16.5 4 11.5v-6L12 2z',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  gem: 'M7 3h10l4 6-9 12L3 9l4-6z',
};

/** A badge, drawn in the badge style chosen in Settings (or the one passed in). */
export function BadgeIcon({ className = 'h-6 w-6', shape }: { className?: string; shape?: string }) {
  const chosen = useBadgeStyle();
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={BADGE_PATHS[shape ?? chosen] ?? BADGE_PATHS.star} />
    </svg>
  );
}

export function ChestIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
      <path d="M3 10a6 6 0 016-6h6a6 6 0 016 6v10H3V10zM3 12h18M10 12v3h4v-3" />
    </svg>
  );
}

/** What came out of the daily chest. */
function ChestContents({ reward }: { reward: ChestReward }) {
  const look = reward.type === 'cosmetic' ? ALL_COSMETICS.find((c) => c.id === reward.id) : undefined;
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-widest text-min">Daily chest</p>
      <div className="mx-auto mt-3 grid h-16 w-16 place-items-center rounded-2xl bg-min text-bg">
        {reward.type === 'shield' ? (
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" aria-hidden>
            <path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6l7-3z" />
          </svg>
        ) : look?.kind === 'badge' ? (
          <BadgeIcon className="h-9 w-9" shape={look.value} />
        ) : look ? (
          <span className="h-10 w-10 rounded-full border-4 border-bg" style={{ background: look.swatch }} />
        ) : (
          <ChestIcon className="h-9 w-9" />
        )}
      </div>
      {reward.type === 'xp' && (
        <>
          <p className="mt-3 text-4xl font-black tabular-nums text-full">+{reward.amount} XP</p>
          <p className="mt-1 text-sm text-muted">{reward.jackpot ? 'Jackpot! Double XP.' : 'Nice. See you tomorrow.'}</p>
        </>
      )}
      {reward.type === 'shield' && (
        <>
          <p className="mt-3 text-xl font-black">Streak shield</p>
          <p className="mt-1 text-sm text-muted">Kept until a missed day needs it. You can hold up to 3.</p>
        </>
      )}
      {look && (
        <>
          <p className="mt-3 text-xl font-black">New look: {look.name}</p>
          <p className="mt-1 text-sm text-muted">
            {look.kind === 'theme' ? 'A colour theme.' : 'A badge style.'} Pick it in Settings → Look and sound.
          </p>
        </>
      )}
    </>
  );
}

export function TrophyIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 3h10v2h3v3a4 4 0 01-4 4h-.3A5 5 0 0113 14.9V18h3v3H8v-3h3v-3.1A5 5 0 018.3 12H8a4 4 0 01-4-4V5h3V3zm0 4H6v1a2 2 0 001 1.7V7zm10 0v2.7A2 2 0 0018 8V7h-1z" />
    </svg>
  );
}

export function SwordIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
    </svg>
  );
}

/** Shows the queue: pills stack above the bottom bar; big cards show one at a time. */
export function Celebrations({ queue, onDone }: { queue: Fx[]; onDone: (id: string) => void }) {
  const pills = queue.filter((f) => !isBig(f));
  const big = queue.find(isBig);

  return (
    <>
      {pills.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2">
          {pills.map((f) => (
            <Pill key={f.id} fx={f} onDone={() => onDone(f.id)} />
          ))}
        </div>
      )}
      {big && <BigCard key={big.id} fx={big} onDone={() => onDone(big.id)} />}
    </>
  );
}
