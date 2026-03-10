// contentKind.ts — Semantic content classification
// Deduces a precise type from raw TMDB metadata.
// RULES: Strict priority (short > documentary > ...)
//        Genres compared in lowercase, FR + EN accepted.
//        Performance: result should be cached via useMemo.

import type { CatalogMeta } from '@/shared/types';

/** Maps TMDB genre IDs to English labels, centralizing genre translation so cards and filters display consistent names regardless of API language. */
export const GENRE_MAP: Record<number, string> = {
  // Movies
  28:    'Action',
  12:    'Adventure',
  16:    'Animation',
  35:    'Comedy',
  80:    'Crime',
  99:    'Documentary',
  18:    'Drama',
  10751: 'Family',
  14:    'Fantasy',
  36:    'History',
  27:    'Horror',
  10402: 'Music',
  9648:  'Mystery',
  10749: 'Romance',
  878:   'Science-Fiction',
  10770: 'TV Movie',
  53:    'Thriller',
  10752: 'War',
  37:    'Western',
  // Series (TV-only IDs)
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk Show',
  10768: 'War & Politics',
};

/** TV combo genres → list of atomic genres */
export const GENRE_ALIASES: Record<string, string[]> = {
  'Action & Adventure':  ['Action', 'Adventure'],
  'Sci-Fi & Fantasy':    ['Science-Fiction', 'Fantasy'],
  'War & Politics':      ['War'],
};

/** Raw TMDB genre — either an object `{id, name}` or a string (backend) */
export type RawGenre = { id: number; name: string } | string;

function normalizeGenreName(genre: RawGenre): string {
  if (typeof genre === 'string') return genre;
  return GENRE_MAP[genre.id] ?? genre.name;
}

/**
 * Converts an array of raw genres into a list of atomic English genre names,
 * splitting combo genres ("Action & Adventure" → ["Action", "Adventure"]).
 */
export function expandGenres(genres: RawGenre[]): string[] {
  return genres.flatMap((g) => {
    const normalized = normalizeGenreName(g);
    return GENRE_ALIASES[normalized] ?? [normalized];
  });
}

/**
 * Extracts the release year from any CatalogMeta format.
 * Returns null if unavailable (item passes the era filter).
 */
export function extractYear(item: { year?: number; release_date?: string; releaseInfo?: string }): number | null {
  if (item.year != null && item.year > 0) return item.year;
  const raw = item.release_date || item.releaseInfo || null;
  if (!raw || raw.length < 4) return null;
  const y = parseInt(raw.slice(0, 4), 10);
  return isNaN(y) || y < 1800 ? null : y;
}

/** Normalizes the many TMDB status strings into a fixed union so UI badges and filters can pattern-match without string comparisons. */
export type SeriesStatus =
  | 'returning'  // "Returning Series" — ongoing
  | 'ended'      // "Ended"
  | 'canceled'   // "Canceled" / "Cancelled"
  | 'planned'    // "Planned" — announced
  | 'inprod'     // "In Production"
  | 'pilot'      // "Pilot"
  | 'unknown';   // null or unknown value

/** Converts raw TMDB status strings (including typos like "Cancelled") into a discriminated union for reliable badge rendering. */
export function normalizeStatus(raw?: string | null): SeriesStatus {
  switch (raw?.toLowerCase()) {
    case 'returning series': return 'returning';
    case 'ended':            return 'ended';
    case 'canceled':
    case 'cancelled':        return 'canceled';
    case 'planned':          return 'planned';
    case 'in production':    return 'inprod';
    case 'pilot':            return 'pilot';
    default:                 return 'unknown';
  }
}

/** Discriminated union of content classifications that drives filtering, theming, and badge display across the catalog. */
export type ContentKind =
  | 'movie'        // Classic film
  | 'short'        // Short film (runtime < 40 min)
  | 'documentary'  // Documentary (movie or series)
  | 'tv'           // Live-action TV series
  | 'anime'        // Japanese animation (movies or series)
  | 'animation'    // Non-Japanese animation (Disney, Pixar, etc.)
  | 'miniseries'   // Short series ≤ 8 episodes or 1 limited season
  | 'reality'      // Reality TV, competitions
  | 'talk'         // Talk shows, late night
  | 'news'         // News, TV journalism
  | 'special';     // Special episode, concert, stand-up

/** Pairs each ContentKind with an i18n label key and emoji icon for use in filter chips and category headers. */
export interface ContentKindMeta {
  kind:     ContentKind;
  labelKey: string;
  icon:     string;
}

/** Ordered list of content categories displayed in the catalog filter bar; order determines UI presentation priority. */
export const CONTENT_KINDS: ContentKindMeta[] = [
  { kind: 'movie',       labelKey: 'catalog.kindMovie',        icon: '🎬' },
  { kind: 'tv',          labelKey: 'catalog.kindTv',           icon: '📺' },
  { kind: 'anime',       labelKey: 'catalog.kindAnime',        icon: '⛩️' },
  { kind: 'animation',   labelKey: 'catalog.kindAnimation',    icon: '🎨' },
  { kind: 'documentary', labelKey: 'catalog.kindDocumentary',  icon: '🎥' },
  { kind: 'miniseries',  labelKey: 'catalog.kindMiniseries',   icon: '📖' },
  { kind: 'reality',     labelKey: 'catalog.kindReality',      icon: '🎭' },
  { kind: 'short',       labelKey: 'catalog.kindShort',        icon: '⏱️' },
  { kind: 'special',     labelKey: 'catalog.kindSpecial',      icon: '⭐' },
];

/** Infers a precise content kind from TMDB metadata using a strict priority chain (short > documentary > anime > ...) to avoid ambiguous multi-genre classification. */
export function classifyContentKind(item: CatalogMeta): ContentKind {
  // Normalize media_type: 'series' → 'tv' for consistency
  const rawType   = item.type || item.media_type || 'movie';
  const mediaType = rawType === 'series' ? 'tv' : rawType; // 'movie' | 'tv'

  const genres = (item.genres ?? []).map((g) =>
    (typeof g === 'string' ? g : (g as { name?: string }).name ?? '').toLowerCase()
  );

  const originCountry = item.origin_country ?? [];
  const originalLang  = item.original_language;
  const runtime       = item.runtime ?? 0;
  const episodeCount  = item.number_of_episodes ?? 0;
  const seasonCount   = item.number_of_seasons ?? 0;

  // Genre detection (EN only, robust partial matching)
  const isAnimation   = genres.some((g) => g.includes('animation'));
  const isDocumentary = genres.some((g) => g.includes('document'));
  const isReality     = genres.some((g) =>
    g.includes('reality') || g === 'reality tv'
  );
  const isTalk = genres.some((g) =>
    g.includes('talk') || g === 'talk show'
  );
  const isNews = genres.some((g) =>
    g.includes('news')
  );

  // 1. Short film
  if (mediaType === 'movie' && runtime > 0 && runtime < 40) return 'short';

  // 2. Documentary (priority over animation)
  if (isDocumentary) return 'documentary';

  // 3. Reality / Talk / News (TV)
  if (isReality) return 'reality';
  if (isTalk)    return 'talk';
  if (isNews)    return 'news';

  // 4. Anime: animation + Japanese origin OR Japanese language
  if (
    isAnimation &&
    (originalLang === 'ja' || originCountry.includes('JP'))
  ) return 'anime';

  // 5. Non-Japanese animation
  if (isAnimation) return 'animation';

  // 6. Miniseries: 1 season + ≤ 8 episodes, or ended short series
  if (
    mediaType === 'tv' &&
    (
      (seasonCount === 1 && episodeCount > 0 && episodeCount <= 8) ||
      (item.status?.toLowerCase() === 'ended' && episodeCount > 0 && episodeCount <= 8)
    )
  ) return 'miniseries';

  // 7. Special: stand-up / concert
  if (
    mediaType === 'movie' &&
    (
      genres.some((g) => g === 'musique' || g === 'music') ||
      (item.title ?? item.name ?? '').toLowerCase().includes('stand-up') ||
      (item.title ?? item.name ?? '').toLowerCase().includes('concert')
    )
  ) return 'special';

  // 8. Default
  return mediaType === 'movie' ? 'movie' : 'tv';
}
