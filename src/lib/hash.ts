/**
 * Turns any text into a number between 0 and 1 that's always the same for the
 * same text (FNV-1a hash). Used for "dice rolls" that can't be re-rolled:
 * double points, quest picks and chest rewards.
 */
export function hash01(text: string): number {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}
