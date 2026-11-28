/**
 * Tap feedback: a short sound and a phone vibration.
 * Sounds are made by the browser (Web Audio), so there are no sound files.
 * Vibration works on Android browsers; iPhones ignore it.
 * Both follow the switches in Settings → Look and sound.
 */
export type FeedbackKind = 'full' | 'min' | 'undo' | 'celebrate' | 'chest' | 'combo' | 'slip';

const prefs = { sound: true, haptics: true };

/** Called by the app whenever the Settings switches change. */
export function setFeedbackPrefs(p: { sound: boolean; haptics: boolean }) {
  prefs.sound = p.sound;
  prefs.haptics = p.haptics;
}

const VIBRATION: Record<FeedbackKind, number | number[]> = {
  full: [18, 40, 28],
  min: 18,
  undo: 8,
  slip: [30, 30, 30],
  combo: [20, 30, 20, 30, 40],
  chest: [30, 60, 30, 60, 80],
  celebrate: [30, 60, 30, 60, 80],
};

/** Notes to play: [frequency in Hz, start in seconds, length in seconds]. */
const NOTES: Record<FeedbackKind, [number, number, number][]> = {
  full: [
    [660, 0, 0.08],
    [990, 0.06, 0.12],
  ],
  min: [[520, 0, 0.1]],
  undo: [[330, 0, 0.08]],
  slip: [
    [300, 0, 0.12],
    [220, 0.1, 0.18],
  ],
  combo: [
    [660, 0, 0.08],
    [830, 0.07, 0.08],
    [990, 0.14, 0.08],
    [1320, 0.21, 0.2],
  ],
  chest: [
    [523, 0, 0.1],
    [659, 0.1, 0.1],
    [784, 0.2, 0.1],
    [1047, 0.3, 0.35],
  ],
  celebrate: [
    [523, 0, 0.12],
    [784, 0.12, 0.12],
    [1047, 0.24, 0.4],
  ],
};

let audio: AudioContext | null = null;

function play(kind: FeedbackKind) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    if (audio.state === 'suspended') void audio.resume();
    const t0 = audio.currentTime + 0.01;
    for (const [freq, start, len] of NOTES[kind]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      // Quick fade in and out, so notes don't click.
      gain.gain.setValueAtTime(0.0001, t0 + start);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len);
      osc.connect(gain).connect(audio.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + len + 0.02);
    }
  } catch {
    // Sound is optional.
  }
}

/** Sound and vibration for a tap or a celebration. */
export function buzz(kind: FeedbackKind) {
  if (prefs.sound) play(kind);
  if (prefs.haptics && 'vibrate' in navigator) {
    try {
      navigator.vibrate(VIBRATION[kind]);
    } catch {
      // Some browsers throw when vibration is blocked; feedback is optional.
    }
  }
}
