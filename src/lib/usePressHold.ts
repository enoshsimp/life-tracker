import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';

/** How long a press must last to count as a hold. */
export const HOLD_MS = 450;
/** A finger moving further than this (in pixels) is scrolling, not tapping. */
const MOVE_LIMIT = 10;

/**
 * Tells a tap from a hold on one element.
 * - Tap: press and let go before HOLD_MS.
 * - Hold: keep pressing for HOLD_MS; it fires while the finger is still down.
 * - Moving the finger, scrolling the page or the browser taking over the touch cancels both.
 * Keyboard: Enter or Space taps, Shift+Enter holds.
 */
export function usePressHold(onTap: () => void, onHold: () => void) {
  const [holding, setHolding] = useState(false);
  const press = useRef<{ x: number; y: number; scrollY: number; timer: number; held: boolean } | null>(null);

  const cancel = useCallback(() => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
    setHolding(false);
  }, []);

  useEffect(() => cancel, [cancel]);

  /** The page moved since the press began, so the finger was scrolling, not pressing. */
  const scrolled = () => !!press.current && Math.abs(window.scrollY - press.current.scrollY) > MOVE_LIMIT / 2;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    cancel();
    const timer = window.setTimeout(() => {
      if (!press.current) return;
      if (scrolled()) return cancel();
      press.current.held = true;
      setHolding(false);
      onHold();
    }, HOLD_MS);
    press.current = { x: e.clientX, y: e.clientY, scrollY: window.scrollY, timer, held: false };
    setHolding(true);
  };

  const onPointerMove = (e: PointerEvent) => {
    const p = press.current;
    if (p && !p.held && (Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_LIMIT || scrolled())) cancel();
  };

  const onPointerUp = () => {
    const p = press.current;
    if (!p) return;
    if (scrolled()) return cancel();
    window.clearTimeout(p.timer);
    press.current = null;
    setHolding(false);
    if (!p.held) onTap();
  };

  return {
    holding,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      // No long-press menu (copy, share, open in new tab…).
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
      // Pointer presses are handled above; a click with detail 0 comes from the keyboard.
      onClick: (e: MouseEvent) => {
        if (e.detail === 0) onTap();
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          onHold();
        }
      },
    },
  };
}
