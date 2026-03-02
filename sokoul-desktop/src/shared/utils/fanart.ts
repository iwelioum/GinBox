// fanartFilters.ts — Utilitaires pour l'API Fanart.tv v3
// RÈGLES : TypeScript strict, pas de librairies externes.

/**
 * Représente un seul objet image retourné par l'API Fanart.
 */
interface FanartImage {
  id: string;
  url: string;
  lang: string;
  likes: string;
}

/**
 * Type complet pour la réponse de l'API Fanart.tv v3,
 * couvrant à la fois les films et les séries TV.
 */
export interface FanartResponse {
  name: string;
  tmdb_id: string;
  imdb_id?: string;
  tvdb_id?: string;

  /** Logo HD transparent avec titre stylisé. Priorité 1 pour le titre. */
  hdmovielogo?: FanartImage[];
  /** Logo HD transparent pour les séries. */
  hdtvlogo?: FanartImage[];
  
  /** Logo standard, souvent moins qualitatif que la version HD. */
  movielogo?: FanartImage[];

  /** Affiches portrait (ratio 2:3). Peut contenir du texte. */
  movieposter?: FanartImage[];
  /** Affiches portrait pour les séries. */
  tvposter?: FanartImage[];

  /** Arrière-plans HD (1920x1080) sans texte. Idéal pour les fonds. */
  moviebackground?: FanartImage[];
  /** Arrière-plans HD pour les séries. */
  showbackground?: FanartImage[];

  /** Images d'art promotionnel. Peut contenir du texte. */
  movieart?: FanartImage[];
  /** Bannières de séries (ratio large). */
  tvbanner?: FanartImage[];
  
  /** Vignettes (thumbnails) 16:9. */
  moviethumb?: FanartImage[];
  /** Vignettes pour les séries. */
  tvthumb?: FanartImage[];
  
  /** Disques (CD/Blu-ray). */
  moviedisc?: FanartImage[];
  /** Bannières de saison pour les séries. */
  seasonbanner?: FanartImage[];
  /** Posters de saison. */
  seasonposter?: FanartImage[];
  /** Vignettes de saison. */
  seasonthumb?: FanartImage[];
  
  /** "Clear Art" HD - logo + artwork transparent sans fond. */
  clearart?: FanartImage[];
  /** HD Clear Art pour les films. */
  hdclearart?: FanartImage[];
  /** "Clear Logo" - logo sans fond. */
  clearlogo?: FanartImage[];
}

/**
 * Retourne une liste d'URLs d'images "propres" (sans texte intégré)
 * à partir d'une réponse Fanart, idéales pour un slideshow en arrière-plan.
 * L'ordre de priorité est le suivant : showbackground > moviebackground > moviethumb > movieart.
 *
 * @param fanart - L'objet de réponse de l'API Fanart.tv.
 * @param mediaType - Le type de média ('movie' ou 'tv').
 * @returns Un tableau d'URLs d'images (string[]).
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
 * Extrait le meilleur logo HD transparent disponible (hdtvlogo ou hdmovielogo).
 * Ces logos sont parfaits pour être superposés sur une image de fond.
 *
 * @param fanart - L'objet de réponse de l'API Fanart.tv.
 * @param mediaType - Le type de média ('movie' ou 'tv').
 * @returns L'URL du logo (string) ou null si aucun n'est trouvé.
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
  
  // Fallback sur d'autres types de logos si les versions HD sont absentes
  const fallbackKeys: (keyof FanartResponse)[] = ['clearlogo', 'movielogo'];
  for (const fbKey of fallbackKeys) {
    const fallbackArray = fanart[fbKey];
    if (Array.isArray(fallbackArray) && fallbackArray.length > 0 && fallbackArray[0].url) {
      return fallbackArray[0].url;
    }
  }

  return null;
}

/**
 * Extrait le clearart HD (png transparent) — logo + artwork sans fond.
 * Idéal pour flotter par-dessus un backdrop sur la DetailsPage.
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
 * Extrait la meilleure affiche disponible au format portrait (2:3).
 * Utilise en priorité les affiches Fanart (movieposter/tvposter)
 * et se rabat sur une URL OMDB si fournie.
 *
 * @param fanart - L'objet de réponse de l'API Fanart.tv.
 * @param omdbFallback - Une URL d'affiche optionnelle depuis OMDB.
 * @returns L'URL de l'affiche (string) ou null si aucune n'est trouvée.
 */
export function getPoster(fanart: FanartResponse | null | undefined, omdbFallback?: string): string | null {
  if (fanart) {
    const sources: (keyof FanartResponse)[] = ['movieposter', 'tvposter', 'seasonposter'];
    for (const key of sources) {
      const images = fanart[key];
      if (Array.isArray(images) && images.length > 0 && images[0].url) {
        // Idéalement, on pourrait trier par `likes` ou langue, mais on prend le premier pour l'instant.
        return images[0].url;
      }
    }
  }

  if (omdbFallback && omdbFallback !== 'N/A') {
    return omdbFallback;
  }

  return null;
}
