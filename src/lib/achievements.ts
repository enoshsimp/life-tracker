import type { AppData } from './types';
import { computeStreak, overallLevel, totalXp } from './game';

/** The numbers badges are judged on, all worked out from saved data. */
export interface BadgeStats {
  ticks: number;
  bestStreak: number;
  fullDays: number;
  weeklyHits: number;
  bonuses: number;
  level: number;
  captures: number;
}

export function badgeStats(data: AppData, today: Date): BadgeStats {
  const streak = computeStreak(data, today);
  return {
    ticks: data.ledger.filter((e) => e.kind !== 'weekly' && e.amount > 0).length,
    bestStreak: streak.best,
    fullDays: streak.fullDays,
    weeklyHits: data.ledger.filter((e) => e.kind === 'weekly').length,
    bonuses: data.ledger.filter((e) => e.bonus).length,
    level: overallLevel(totalXp(data)).level,
    captures: data.inbox.length,
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: (s: BadgeStats) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first-tick', name: 'First step', description: 'Tick your first habit', earned: (s) => s.ticks >= 1 },
  { id: 'streak-3', name: 'On a roll', description: 'Reach a 3-day streak', earned: (s) => s.bestStreak >= 3 },
  { id: 'streak-7', name: 'One week strong', description: 'Reach a 7-day streak', earned: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', name: 'Unbreakable', description: 'Reach a 30-day streak', earned: (s) => s.bestStreak >= 30 },
  { id: 'streak-100', name: 'Centurion', description: 'Reach a 100-day streak', earned: (s) => s.bestStreak >= 100 },
  { id: 'full-7', name: 'Full send', description: '7 days with everything at full', earned: (s) => s.fullDays >= 7 },
  { id: 'full-30', name: 'Thirty full days', description: '30 days with everything at full', earned: (s) => s.fullDays >= 30 },
  { id: 'weekly-1', name: 'Target hit', description: 'Hit a times-a-week target', earned: (s) => s.weeklyHits >= 1 },
  { id: 'weekly-10', name: 'Target machine', description: 'Hit 10 weekly targets', earned: (s) => s.weeklyHits >= 10 },
  { id: 'lucky', name: 'Lucky break', description: 'Earn a double-points bonus', earned: (s) => s.bonuses >= 1 },
  { id: 'level-5', name: 'Level 5', description: 'Reach level 5', earned: (s) => s.level >= 5 },
  { id: 'level-10', name: 'Level 10', description: 'Reach level 10', earned: (s) => s.level >= 10 },
  { id: 'capture-10', name: 'Idea machine', description: 'Capture 10 things in the Inbox', earned: (s) => s.captures >= 10 },
];

/** Badges earned now that aren't recorded yet. */
export function newlyEarned(data: AppData, today: Date): Badge[] {
  const stats = badgeStats(data, today);
  return BADGES.filter((b) => !data.achievements[b.id] && b.earned(stats));
}
