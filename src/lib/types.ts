/** How a habit is ticked: a full/minimum pair, or a single yes/no check. */
export type HabitKind = 'fullmin' | 'check';

/** What was done for a habit on a day. A yes/no check is stored as 'full'. */
export type TickLevel = 'full' | 'min';

/** The part of the day a habit belongs to. Today groups habits under these headings. */
export type TimeOfDay = 'morning' | 'work' | 'evening' | 'anytime';

/** How often a habit is due. */
export type Frequency =
  | { type: 'daily' }
  /** Only on these weekdays (0 = Sunday … 6 = Saturday). */
  | { type: 'days'; days: number[] }
  /** Any day, this many times per week. */
  | { type: 'weekly'; times: number };

export interface LifeArea {
  /** Fixed id; only the name can change. */
  id: string;
  name: string;
}

export interface Habit {
  id: string;
  name: string;
  kind: HabitKind;
  /** Short description of the full version (fullmin habits only). */
  fullLabel?: string;
  /** Short description of the minimum version (fullmin habits only). */
  minLabel?: string;
  areaId: string;
  time: TimeOfDay;
  frequency: Frequency;
  /** Marks the gym habit, which is set up on its own and counted on the Health tab. */
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
  areas: LifeArea[];
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

export type CaptureTag = 'idea' | 'task' | 'reminder' | 'explore';

export interface InboxItem {
  id: string;
  text: string;
  tag?: CaptureTag;
  /** ISO timestamp. */
  createdAt: string;
  done: boolean;
}

export interface AppData {
  version: 3;
  /** False until the first-run setup wizard has been completed. */
  setupDone: boolean;
  settings: Settings;
  /** Keyed by app-day, "YYYY-MM-DD". */
  days: Record<string, DayRecord>;
  /** Quick captures, newest first. */
  inbox: InboxItem[];
}
