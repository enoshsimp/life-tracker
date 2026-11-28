/**
 * The daily chest: one a day, opened by completing the day or finishing the
 * evening check-in. What's inside is a fixed "dice roll" on the date, so it
 * can't be re-rolled.
 *
 * - XP (most of the time, sometimes doubled),
 * - a streak shield (kept until a missed day needs it, at most 3 banked),
 * - a new look (colour theme or badge style).
 * A shield at the cap, or a look when you have them all, turns into XP.
 */
import type { AppData, ChestReward } from './types';
import { hash01 } from './hash';
import { newId } from './id';
import { computeStreak, MAX_BANKED_SHIELDS } from './game';
import { parseKey } from './day';
import { CHEST_COSMETICS, unlockedCosmetics } from './cosmetics';
import { DEFAULT_AREA_ID } from './defaults';

/** Opens today's chest if it hasn't been opened yet. Returns the same object if it has. */
export function openChest(data: AppData, dayKey: string, at: Date = new Date()): AppData {
  if (data.chests[dayKey]) return data;
  const g = data.settings.game;
  const roll = hash01(`${dayKey}|chest`);
  const xp = (): ChestReward => {
    const jackpot = hash01(`${dayKey}|chest|jackpot`) < 0.2;
    return { type: 'xp', amount: g.chestXp * (jackpot ? 2 : 1), ...(jackpot ? { jackpot: true } : {}) };
  };

  let reward: ChestReward;
  if (roll < 0.6) reward = xp();
  else if (roll < 0.8) reward = computeStreak(data, parseKey(dayKey)).banked >= MAX_BANKED_SHIELDS ? xp() : { type: 'shield' };
  else {
    const owned = unlockedCosmetics(data);
    const left = CHEST_COSMETICS.filter((c) => !owned.has(c.id));
    reward = left.length ? { type: 'cosmetic', id: left[Math.floor(hash01(`${dayKey}|chest|look`) * left.length)].id } : xp();
  }

  const next: AppData = { ...data, chests: { ...data.chests, [dayKey]: reward } };
  if (reward.type !== 'xp' || !(reward.amount > 0)) return next;
  return {
    ...next,
    ledger: [...next.ledger, { id: newId(), at: at.toISOString(), day: dayKey, kind: 'chest', ref: 'chest', amount: reward.amount, areaId: DEFAULT_AREA_ID }],
  };
}
