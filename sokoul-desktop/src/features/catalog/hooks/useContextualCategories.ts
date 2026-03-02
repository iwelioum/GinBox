import { useMemo } from 'react';
import {
  CATEGORIES,
  getFeaturedCategories,
  type Category,
  type TimeOfDay,
  type Season,
  type DayType,
} from '../config/categories.config';

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 && h < 24) return 'night';
  return 'late-night';
}

function getSeason(): Season {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

function getDayType(): DayType {
  return [0, 6].includes(new Date().getDay()) ? 'weekend' : 'weekday';
}

function getGreeting(): string {
  const tod = getTimeOfDay();
  switch (tod) {
    case 'morning':    return 'Bonjour, un bon film pour bien commencer ?';
    case 'afternoon':  return 'Bon apres-midi ! Envie de quoi ?';
    case 'evening':    return 'Bonsoir, c\'est l\'heure du cinema.';
    case 'night':      return 'Bonne nuit, un dernier film ?';
    case 'late-night': return 'Encore debout ? Parfait, on a ce qu\'il faut.';
  }
}

function scoreCategory(cat: Category, tod: TimeOfDay, season: Season, day: DayType): number {
  let score = 0;
  if (cat.featured)                             score += 3;
  if (cat.timeOfDay?.includes(tod))             score += 2;
  if (cat.seasons?.includes(season))            score += 2;
  if (cat.dayOfWeek?.includes(day))             score += 1;
  // Small deterministic noise from weight to break ties
  score += (100 - cat.weight) / 200;
  return score;
}

/** Shape returned by useContextualCategories, exposing both the curated home list and raw context signals for downstream UI decisions. */
interface ContextualResult {
  greeting:           string;
  homePageCategories: Category[];
  allCategories:      Category[];
  timeOfDay:          TimeOfDay;
  season:             Season;
  dayType:            DayType;
}

const MAX_HOME_CATEGORIES = 20;

/**
 * Selects and ranks categories based on time of day, season, and weekday/weekend
 * to deliver a personalised browsing experience without requiring user accounts.
 * Featured categories always appear first; contextual scoring fills the remaining slots.
 */
export function useContextualCategories(): ContextualResult {
  return useMemo(() => {
    const tod    = getTimeOfDay();
    const season = getSeason();
    const day    = getDayType();

    const featured = getFeaturedCategories();

    // Score all categories, take the top ones
    const scored = CATEGORIES
      .map(cat => ({ cat, score: scoreCategory(cat, tod, season, day) }))
      .sort((a, b) => b.score - a.score);

    // Featured first, then contextual fills
    const seen = new Set<string>();
    const home: Category[] = [];

    // Always include featured
    for (const cat of featured) {
      if (home.length >= MAX_HOME_CATEGORIES) break;
      if (!seen.has(cat.id)) {
        seen.add(cat.id);
        home.push(cat);
      }
    }

    // Fill rest from highest scored
    for (const { cat } of scored) {
      if (home.length >= MAX_HOME_CATEGORIES) break;
      if (!seen.has(cat.id)) {
        seen.add(cat.id);
        home.push(cat);
      }
    }

    return {
      greeting:           getGreeting(),
      homePageCategories: home,
      allCategories:      CATEGORIES,
      timeOfDay:          tod,
      season,
      dayType:            day,
    };
  }, []);
}
