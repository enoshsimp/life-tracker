/**
 * A short unique id. (crypto.randomUUID isn't available when the app is
 * opened over plain http on the home network, so this avoids it.)
 */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
