// topPosters.ts — Top Posters API integration for filling TMDB poster gaps.
// API: https://api.top-streaming.stream/{key}/tmdb/poster/{type}-{id}.jpg
// fallback_url: redirects transparently to TMDB if Top Posters has no image.

import type { CatalogMeta } from '../types';

const BASE      = 'https://api.top-streaming.stream';
const APIKEY    = import.meta.env.VITE_TOP_POSTERS_KEY as string | undefined;
const TMDB_W500 = 'https://image.tmdb.org/t/p/w500';

/** Extracts a numeric TMDB ID from the various ID formats used in the app. */
function extractTmdbId(id: string): string | null {
  // "movie:123" or "series:456"
  if (id.includes(':')) {
    const n = id.split(':').pop()!;
    return /^\d+$/.test(n) ? n : null;
  }
  // "movie-123" or "series-123"
  const prefixed = id.match(/^(?:movie|series|tv|show)-(\d+)$/i);
  if (prefixed) return prefixed[1];
  // plain numeric
  if (/^\d+$/.test(id)) return id;
  return null;
}

/**
 * Returns a Top Posters URL for the item's poster.
 * If the item has a TMDB poster_path, it is embedded as fallback_url so the
 * browser transparently falls back to TMDB when Top Posters has no image.
 * Returns null if the item has no recognisable TMDB ID.
 */
export function getTopPosterUrl(item: CatalogMeta): string | null {
  if (!APIKEY) return null;
  const numericId = extractTmdbId(item.id);
  if (!numericId) return null;

  const rawType = item.media_type ?? item.type;
  const contentType = (rawType === 'series' || rawType === 'tv') ? 'series' : 'movie';

  const rawPath = item.poster_path ?? item.poster;
  let fallbackUrl: string | undefined;
  if (rawPath) {
    fallbackUrl = rawPath.startsWith('http')
      ? rawPath
      : `${TMDB_W500}${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;
  }

  const params = fallbackUrl ? `?fallback_url=${encodeURIComponent(fallbackUrl)}` : '';
  return `${BASE}/${APIKEY}/tmdb/poster/${contentType}-${numericId}.jpg${params}`;
}
