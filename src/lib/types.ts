/** How a habit is ticked: a full/minimum pair, or a single yes/no check. */
export type HabitKind = 'fullmin' | 'check';

/** What was done for a habit on a day. A yes/no check is stored as 'full'. */
export type TickLevel = 'full' | 'min';

export interface Habit {
  id: string;
  name: string;
  kind: HabitKind;
  /** Short description of the full version (fullmin habits only). */
  fullLabel?: string;
  /** Short description of the minimum version (fullmin habits only). */
  minLabel?: string;
  /** Weekdays the habit is scheduled (0 = Sunday … 6 = Saturday). Missing = every day. */
  days?: number[];
  /** Marks the gym habit, which is set up on its own and counted on the Body tab. */
  gym?: boolean;
}

export interface WorkStream {
  id: string;
  name: string;
}

export interface Settings {
  /** Hour (0–23) when a new app-day begins. */
  dayStartHour: number;
  /** First day of the week: 1 = Monday, 0 = Sunday. */
  weekStartsOn: 0 | 1;
  habits: Habit[];
  workStreams: WorkStream[];
  /** Latest wake time ("HH:MM") that still earns the full version. */
  wakeBy: string;
  /** Latest bedtime ("HH:MM") that still earns the full version. */
  bedBy: string;
}

export interface TimeLog {
  /** ISO timestamp of the tap. */
  at: string;
  level: TickLevel;
}

export interface Priority {
  text: string;
  done: boolean;
}

export interface DayRecord {
  ticks: Record<string, TickLevel>;
  wake?: TimeLog;
  bed?: TimeLog;
  priorities: Record<string, Priority>;
}

export interface AppData {
  version: 2;
  /** False until the first-run setup wizard has been completed. */
  setupDone: boolean;
  settings: Settings;
  /** Keyed by app-day, "YYYY-MM-DD". */
  days: Record<string, DayRecord>;
}
