import { createContext, useContext } from 'react';
import type { AppData } from './types';

/** A look found in the daily chest: a colour theme or a badge style. Never bought. */
export interface Cosmetic {
  /** "theme:<id>" or "badge:<id>". */
  id: string;
  kind: 'theme' | 'badge';
  /** The value saved in settings.cosmetics. */
  value: string;
  name: string;
  /** Preview colour (themes) . */
  swatch?: string;
}

/** The looks everyone has from the start. */
export const STARTER_THEME: Cosmetic = { id: 'theme:default', kind: 'theme', value: 'default', name: 'Indigo', swatch: '#818cf8' };
export const STARTER_BADGE: Cosmetic = { id: 'badge:star', kind: 'badge', value: 'star', name: 'Star' };

/** Looks the chest can give. Each theme's colours live in index.css under [data-theme]. */
export const CHEST_COSMETICS: Cosmetic[] = [
  { id: 'theme:ocean', kind: 'theme', value: 'ocean', name: 'Ocean', swatch: '#38bdf8' },
  { id: 'theme:ember', kind: 'theme', value: 'ember', name: 'Ember', swatch: '#fb923c' },
  { id: 'theme:rose', kind: 'theme', value: 'rose', name: 'Rose', swatch: '#f472b6' },
  { id: 'theme:gold', kind: 'theme', value: 'gold', name: 'Gold', swatch: '#facc15' },
  { id: 'theme:violet', kind: 'theme', value: 'violet', name: 'Violet', swatch: '#c084fc' },
  { id: 'badge:shield', kind: 'badge', value: 'shield', name: 'Shield' },
  { id: 'badge:heart', kind: 'badge', value: 'heart', name: 'Heart' },
  { id: 'badge:bolt', kind: 'badge', value: 'bolt', name: 'Bolt' },
  { id: 'badge:gem', kind: 'badge', value: 'gem', name: 'Gem' },
];

export const ALL_COSMETICS = [STARTER_THEME, STARTER_BADGE, ...CHEST_COSMETICS];

/** Looks you own: the starters plus everything found in chests. */
export function unlockedCosmetics(data: AppData): Set<string> {
  const ids = new Set([STARTER_THEME.id, STARTER_BADGE.id]);
  for (const c of Object.values(data.chests)) if (c.type === 'cosmetic') ids.add(c.id);
  return ids;
}

/** The badge style in use, so every badge icon can draw it without passing it down. */
export const BadgeStyleContext = createContext('star');
export const useBadgeStyle = () => useContext(BadgeStyleContext);
