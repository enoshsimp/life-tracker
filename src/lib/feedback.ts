/** A short phone vibration on supported devices (Android browsers; iPhones ignore it). */
export function buzz(level: 'full' | 'min' | 'undo') {
  if (!('vibrate' in navigator)) return;
  const pattern = level === 'full' ? [18, 40, 28] : level === 'min' ? 18 : 8;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when vibration is blocked; feedback is optional.
  }
}
