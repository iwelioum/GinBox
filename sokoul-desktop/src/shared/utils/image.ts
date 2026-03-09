import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

/**
 * Builds a full TMDB image URL from a path fragment or passes through absolute URLs.
 * Replaces `/w500/` with the requested size when the path is already absolute.
 */
export function buildTmdbImageUrl(
  path: string | undefined | null,
  size = 'w780',
): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path.replace('/w500/', `/${size}/`);
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}
