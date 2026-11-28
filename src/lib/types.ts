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
  /** Points for the full version (or for a yes/no tick). */
  fullPoints: number;
  /** Points for the minimum version. */
  minPoints: number;
  /** First app-day ("YYYY-MM-DD") the habit counts towards the streak. Missing = always. */
  since?: string;
  /** Marks the gym habit, which is set up on its own and counted on the Health tab. */
  gym?: boolean;
}

/**
 * How a bad habit is cut down.
 * - quit: any slip counts.
 * - daily: up to `limit` a day is fine.
 * - weekly: up to `limit` a week is fine.
 */
export type ReduceType = 'quit' | 'daily' | 'weekly';

/** A habit you want to do less of. It's clean by default; you only log slips (or uses, for a limit). */
export interface BadHabit {
  id: string;
  name: string;
  type: ReduceType;
  /** Allowed uses per day or week (limits only; 0 for quit). */
  limit: number;
  /** Clean days needed to defeat its boss. */
  bossTarget: number;
  /** Life area that earns the XP. */
  areaId: string;
  /** First app-day ("YYYY-MM-DD") it's tracked. */
  since: string;
}

export interface WorkStream {
  id: string;
  name: string;
  /** Life area that earns XP when this stream's priority is done. */
  areaId: string;
}

/** Point values and chances for the game layer. All editable in Settings. */
export interface GameSettings {
  /** Points for logging wake or bed time on time / late. */
  sleepFull: number;
  sleepMin: number;
  /** Points for finishing a work stream's top priority. */
  priorityPoints: number;
  /** Extra points for hitting a times-a-week target. */
  weeklyBonus: number;
  /** Chance (0–1) that a tick earns double points. */
  bonusChance: number;
  /** Points for each finished day a bad habit stayed clean. */
  cleanDay: number;
  /** Extra points for a clean day straight after a slip. */
  comeback: number;
  /** Points for each urge resisted… */
  resisted: number;
  /** …for up to this many urges per bad habit per day. */
  resistedCap: number;
  /** HP a boss gets back for each slip. */
  slipHeal: number;
  /** Points for defeating a boss. */
  bossDefeat: number;
}

export interface Settings {
  /** Hour (0–23) when a new app-day begins. */
  dayStartHour: number;
  /** First day of the week: 1 = Monday, 0 = Sunday. */
  weekStartsOn: 0 | 1;
  areas: LifeArea[];
  habits: Habit[];
  /** Habits to cut down. Kept apart from `habits`, so they never affect the main streak. */
  badHabits: BadHabit[];
  workStreams: WorkStream[];
  /** Latest wake time ("HH:MM") that still earns the full version. */
  wakeBy: string;
  /** Latest bedtime ("HH:MM") that still earns the full version. */
  bedBy: string;
  /** From this time ("HH:MM") Today offers the evening check-in. */
  checkInFrom: string;
  game: GameSettings;
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

/** An evening check-in answer that isn't a tick: "not done today", or "stayed clean" for a bad habit. */
export type CheckInAnswer = 'no' | 'clean';

export interface DayRecord {
  ticks: Record<string, TickLevel>;
  wake?: TimeLog;
  bed?: TimeLog;
  priorities: Record<string, Priority>;
  /** Evening check-in: habit or work-stream id → answered "not done", so its card doesn't come back. */
  checkIn?: Record<string, CheckInAnswer>;
  /** Bad habit id → slips that day (for a limit: times used). */
  slips?: Record<string, number>;
  /** Bad habit id → urges resisted that day. */
  resisted?: Record<string, number>;
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

/** What a ledger entry was for. Later stages add more (personal bests, purchases…). */
export type LedgerKind = 'habit' | 'wake' | 'bed' | 'priority' | 'weekly' | 'resisted' | 'clean' | 'comeback' | 'boss';

/** One line in the points ledger. Spending (later) is a negative amount. */
export interface LedgerEntry {
  id: string;
  /** ISO timestamp it was recorded. */
  at: string;
  /** App-day it belongs to ("YYYY-MM-DD"). For weekly bonuses, the first day of that week. */
  day: string;
  kind: LedgerKind;
  /** The habit, bad habit, work stream or "wake"/"bed" it came from. For a boss defeat: "badHabitId#round". */
  ref: string;
  amount: number;
  /** Life area that earns the XP. */
  areaId?: string;
  /** True when the random bonus doubled it. */
  bonus?: boolean;
}

/** Housekeeping about the data itself. */
export interface Meta {
  /** When a backup file was last saved (ISO timestamp). */
  lastBackup?: string;
}

export interface AppData {
  version: 7;
  /** False until the first-run setup wizard has been completed. */
  setupDone: boolean;
  settings: Settings;
  /** Keyed by app-day, "YYYY-MM-DD". */
  days: Record<string, DayRecord>;
  /** Quick captures, newest first. */
  inbox: InboxItem[];
  /** Every point earned (and later, spent). */
  ledger: LedgerEntry[];
  /** Badges unlocked: badge id → ISO timestamp. */
  achievements: Record<string, string>;
  meta: Meta;
}
