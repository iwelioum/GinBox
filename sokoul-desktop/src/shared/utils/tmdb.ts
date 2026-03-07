/** Shared TMDB / Fanart utility functions used across catalog components. */

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
