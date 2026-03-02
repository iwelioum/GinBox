/** Shared TMDB / Fanart utility functions used across catalog components. */

import type { CatalogMeta } from '../types/index';

/**
 * Extracts the best logo URL from a Fanart.tv API response.
 * Prefers French logos, falls back to English, then any available.
 */
export function extractLogo(data: unknown): string | null {
  if (!data) return null;
  const d = data as Record<string, Array<{ url: string; lang?: string }>>;
  const logos = d.hdmovielogo ?? d.hdtvlogo ?? d.movielogo ?? d.tvlogo ?? [];
  return (logos.find(l => l.lang === 'fr') ?? logos.find(l => l.lang === 'en') ?? logos[0])?.url ?? null;
}

/**
 * Builds a TMDB backdrop image URL at the requested size.
 * Handles both absolute URLs and relative TMDB paths.
 */
export function getBackdropUrl(item: CatalogMeta, size: 'w780' | 'original' = 'w780'): string | null {
  const raw = item.backdrop_path ?? item.background ?? null;
  if (!raw) return null;
  if (raw.startsWith('http')) return raw.replace('/w500/', `/${size}/`).replace('/w780/', `/${size}/`);
  return `https://image.tmdb.org/t/p/${size}${raw}`;
}

/**
 * Extracts the numeric TMDB ID from a potentially prefixed ID string.
 * E.g. "movie:12345" → "12345", "12345" → "12345".
 */
export function getTmdbId(item: CatalogMeta): string {
  return item.id.includes(':') ? item.id.split(':').pop()! : item.id;
}
