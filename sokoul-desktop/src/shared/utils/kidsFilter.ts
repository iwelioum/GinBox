// kidsFilter.ts — Content filtering for kids profiles
// Uses TMDB genre IDs to determine age-appropriateness.

/** TMDB genre IDs that are inappropriate for kids */
const EXCLUDED_GENRE_IDS = new Set([
  27,    // Horror
  80,    // Crime
  10752, // War
  53,    // Thriller
  10749, // Romance (adult-themed)
]);

/** TMDB genre IDs that are safe for kids */
const KIDS_SAFE_GENRE_IDS = new Set([
  16,    // Animation
  10751, // Family
  10770, // TV Movie (often family-friendly)
]);

interface FilterableContent {
  genre_ids?: number[];
  genres?: Array<{ id?: number; name?: string } | string>;
}

/**
 * Returns true if the content is appropriate for a kids profile.
 * Strategy: exclude content with explicit adult genres;
 * if no genre data is available, include it (fail-open for better UX).
 */
export function isKidsAppropriate(meta: FilterableContent): boolean {
  const ids = getGenreIds(meta);
  if (ids.length === 0) return true;

  for (const id of ids) {
    if (EXCLUDED_GENRE_IDS.has(id)) return false;
  }
  return true;
}

function getGenreIds(meta: FilterableContent): number[] {
  if (meta.genre_ids && meta.genre_ids.length > 0) return meta.genre_ids;
  if (meta.genres && meta.genres.length > 0) {
    return meta.genres
      .map(g => (typeof g === 'string' ? undefined : g.id))
      .filter((id): id is number => id !== undefined);
  }
  return [];
}
