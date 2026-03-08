/** Shared TMDB / Fanart utility functions used across catalog components. */

/**
 * Extracts the best logo URL from a Fanart.tv API response.
 * Prefers French logos, falls back to English, then any available.
 */
export function extractLogo(data: unknown): string | null {
  if (!data) return null;
  const d = data as Record<string, Array<{ url: string; lang?: string }>>;

  // Exhaustive priority: HD logos > standard logos > clear logos/art
  const keys = [
    'hdmovielogo', 'hdtvlogo',
    'movielogo', 'tvlogo',
    'clearlogo',
    'hdclearart', 'clearart',
  ];

  for (const key of keys) {
    const arr = d[key];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const match = arr.find(l => l.lang === 'fr') ?? arr.find(l => l.lang === 'en') ?? arr[0];
    if (match?.url) return match.url;
  }

  return null;
}
