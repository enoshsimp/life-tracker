/**
 * The app-day: a day starts at `dayStartHour` (default 4am), not midnight.
 * Anything done before that hour belongs to the previous day.
 */

/** The current time. In development, `?now=2026-11-24T02:30` in the URL fakes it for testing. */
export function getNow(): Date {
  if (import.meta.env.DEV) {
    const fake = new URLSearchParams(window.location.search).get('now');
    if (fake) {
      const d = new Date(fake);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

/** The calendar date the app-day falls on (local time, at midnight). */
export function appDayDate(now: Date, dayStartHour: number): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() < dayStartHour) d.setDate(d.getDate() - 1);
  return d;
}

/** "YYYY-MM-DD" key for the app-day containing `now`. */
export function appDayKey(now: Date, dayStartHour: number): string {
  const d = appDayDate(now, dayStartHour);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Minutes since the app-day began, so times after midnight sort after
 * the evening (e.g. 00:30 is later than 23:00 when the day starts at 4am).
 */
export function minutesIntoAppDay(hours: number, minutes: number, dayStartHour: number): number {
  return (hours * 60 + minutes - dayStartHour * 60 + 1440) % 1440;
}

/** True when `at` is no later than the "HH:MM" deadline, measured within the app-day. */
export function isOnTime(at: Date, deadline: string, dayStartHour: number): boolean {
  const [h, m] = deadline.split(':').map(Number);
  return (
    minutesIntoAppDay(at.getHours(), at.getMinutes(), dayStartHour) <=
    minutesIntoAppDay(h, m, dayStartHour)
  );
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
