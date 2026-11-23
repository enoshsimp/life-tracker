/** A short phone vibration on supported devices (Android browsers; iPhones ignore it). */
export function buzz(level: 'full' | 'min' | 'undo' | 'celebrate') {
  if (!('vibrate' in navigator)) return;
  const pattern = level === 'celebrate' ? [30, 60, 30, 60, 80] : level === 'full' ? [18, 40, 28] : level === 'min' ? 18 : 8;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when vibration is blocked; feedback is optional.
  }
}
