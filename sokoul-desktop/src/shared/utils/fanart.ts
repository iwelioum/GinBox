// fanartFilters.ts — Utilities for the Fanart.tv v3 API
// RULES: Strict TypeScript, no external libraries.

/**
 * Represents a single image object returned by the Fanart API.
 */
interface FanartImage {
  id: string;
  url: string;
  lang: string;
  likes: string;
}

/**
 * Complete type for the Fanart.tv v3 API response,
 * covering both movies and TV series.
 */
export interface FanartResponse {
  name: string;
  tmdb_id: string;
  imdb_id?: string;
  tvdb_id?: string;

  /** Transparent HD logo with stylized title. Priority 1 for the title. */
  hdmovielogo?: FanartImage[];
  /** Transparent HD logo for TV series. */
  hdtvlogo?: FanartImage[];
  
  /** Standard logo, often lower quality than the HD version. */
  movielogo?: FanartImage[];

  /** Portrait posters (2:3 ratio). May contain text. */
  movieposter?: FanartImage[];
  /** Portrait posters for TV series. */
  tvposter?: FanartImage[];

  /** HD backgrounds (1920x1080) without text. Ideal for backdrops. */
  moviebackground?: FanartImage[];
  /** HD backgrounds for TV series. */
  showbackground?: FanartImage[];

  /** Promotional art images. May contain text. */
  movieart?: FanartImage[];
  /** TV series banners (wide ratio). */
  tvbanner?: FanartImage[];
  
  /** Thumbnails 16:9. */
  moviethumb?: FanartImage[];
  /** Thumbnails for TV series. */
  tvthumb?: FanartImage[];
  
  /** Discs (CD/Blu-ray). */
  moviedisc?: FanartImage[];
  /** Season banners for TV series. */
  seasonbanner?: FanartImage[];
  /** Season posters. */
  seasonposter?: FanartImage[];
  /** Season thumbnails. */
  seasonthumb?: FanartImage[];
  
  /** "Clear Art" HD - logo + artwork transparent sans fond. */
  clearart?: FanartImage[];
  /** HD Clear Art for movies. */
  hdclearart?: FanartImage[];
  /** "Clear Logo" - logo sans fond. */
  clearlogo?: FanartImage[];
}

/**
 * Returns a list of "clean" image URLs (without embedded text)
 * from a Fanart response, ideal for a background slideshow.
 * Priority order: showbackground > moviebackground > moviethumb > movieart.
 *
 * @param fanart - The Fanart.tv API response object.
 * @param mediaType - The media type ('movie' or 'tv').
 * @returns An array of image URLs (string[]).
 */
export function getCleanImages(fanart: FanartResponse | null | undefined, mediaType: 'movie' | 'tv'): string[] {
  if (!fanart) {
    return [];
  }

  const sources: (keyof FanartResponse)[] = mediaType === 'tv'
    ? ['showbackground', 'tvthumb']
    : ['moviebackground', 'moviethumb', 'movieart'];

  for (const key of sources) {
    const images = fanart[key];
    if (Array.isArray(images) && images.length > 0) {
      return images.map(img => img.url);
    }
  }

  return [];
}

/**
 * Extracts the best available transparent HD logo (hdtvlogo or hdmovielogo).
 * These logos are perfect for overlaying on a background image.
 *
 * @param fanart - The Fanart.tv API response object.
 * @param mediaType - The media type ('movie' or 'tv').
 * @returns The logo URL (string) or null if none is found.
 */
export function getLogo(fanart: FanartResponse | null | undefined, mediaType: 'movie' | 'tv'): string | null {
  if (!fanart) {
    return null;
  }

  const key = mediaType === 'tv' ? 'hdtvlogo' : 'hdmovielogo';
  const logoArray = fanart[key];

  if (Array.isArray(logoArray) && logoArray.length > 0 && logoArray[0].url) {
    return logoArray[0].url;
  }

  // Fallback — exhaustive priority across both movie and TV logo keys
  const fallbackKeys: (keyof FanartResponse)[] = mediaType === 'tv'
    ? ['clearlogo', 'hdmovielogo', 'movielogo']
    : ['clearlogo', 'hdtvlogo',    'movielogo'];
  for (const fbKey of fallbackKeys) {
    const fallbackArray = fanart[fbKey];
    if (Array.isArray(fallbackArray) && fallbackArray.length > 0 && fallbackArray[0].url) {
      return fallbackArray[0].url;
    }
  }

  return null;
}

/**
 * Extracts HD clear art (transparent png) — logo + artwork without background.
 * Ideal for floating over a backdrop on the DetailsPage.
 */
export function getClearArt(fanart: FanartResponse | null | undefined, mediaType: 'movie' | 'tv'): string | null {
  if (!fanart) return null;

  const sources: (keyof FanartResponse)[] = mediaType === 'tv'
    ? ['clearart', 'clearlogo', 'tvbanner']
    : ['hdclearart', 'clearart', 'clearlogo', 'movieart'];

  for (const key of sources) {
    const arr = fanart[key as keyof FanartResponse];
    if (Array.isArray(arr) && arr.length > 0 && arr[0].url) {
      return arr[0].url;
    }
  }
  return null;
}

/**
 * Extracts the best available portrait poster (2:3 ratio).
 * Prioritizes Fanart posters (movieposter/tvposter)
 * and falls back to an OMDB URL if provided.
 *
 * @param fanart - The Fanart.tv API response object.
 * @param omdbFallback - An optional poster URL from OMDB.
 * @returns The poster URL (string) or null if none is found.
 */
export function getPoster(fanart: FanartResponse | null | undefined, omdbFallback?: string): string | null {
  if (fanart) {
    const sources: (keyof FanartResponse)[] = ['movieposter', 'tvposter', 'seasonposter'];
    for (const key of sources) {
      const images = fanart[key];
      if (Array.isArray(images) && images.length > 0 && images[0].url) {
        // Ideally, we could sort by `likes` or language, but we take the first one for now.
        return images[0].url;
      }
    }
  }

  if (omdbFallback && omdbFallback !== 'N/A') {
    return omdbFallback;
  }

  return null;
}
