// contentKind.ts — Classification sémantique du contenu
// Déduit un type précis depuis les métadonnées TMDB brutes.
// RÈGLES : Priorité stricte (court-métrage > documentaire > …)
//          Genres comparés en minuscules, FR + EN acceptés.
//          Performance : résultat à mettre en cache via useMemo.

import type { CatalogMeta } from '@/shared/types';

/** Maps TMDB genre IDs to French labels, centralizing genre translation so cards and filters display consistent names regardless of API language. */
export const GENRE_MAP: Record<number, string> = {
  // Films
  28:    'Action',
  12:    'Aventure',
  16:    'Animation',
  35:    'Comédie',
  80:    'Crime',
  99:    'Documentaire',
  18:    'Drame',
  10751: 'Famille',
  14:    'Fantastique',
  36:    'Histoire',
  27:    'Horreur',
  10402: 'Musique',
  9648:  'Mystère',
  10749: 'Romance',
  878:   'Science-Fiction',
  10770: 'Téléfilm',
  53:    'Thriller',
  10752: 'Guerre',
  37:    'Western',
  // Séries (IDs TV-only)
  10759: 'Action & Aventure',
  10762: 'Enfants',
  10763: 'Actualités',
  10764: 'Télé-réalité',
  10765: 'Sci-Fi & Fantastique',
  10766: 'Soap',
  10767: 'Talk Show',
  10768: 'Guerre & Politique',
};

/** Genres combo TV → liste de genres atomiques */
export const GENRE_ALIASES: Record<string, string[]> = {
  'Action & Aventure':    ['Action', 'Aventure'],
  'Sci-Fi & Fantastique': ['Science-Fiction', 'Fantastique'],
  'Guerre & Politique':   ['Guerre'],
};

/** Genre brut TMDB — soit un objet `{id, name}`, soit un string (backend) */
export type RawGenre = { id: number; name: string } | string;

function normalizeGenreName(genre: RawGenre): string {
  if (typeof genre === 'string') return genre;
  return GENRE_MAP[genre.id] ?? genre.name;
}

/**
 * Convertit un tableau de genres bruts en liste de noms atomiques français,
 * en éclatant les genres combo ("Action & Aventure" → ["Action", "Aventure"]).
 */
export function expandGenres(genres: RawGenre[]): string[] {
  return genres.flatMap((g) => {
    const normalized = normalizeGenreName(g);
    return GENRE_ALIASES[normalized] ?? [normalized];
  });
}

/**
 * Extrait l'année de sortie depuis n'importe quel format de CatalogMeta.
 * Retourne null si indisponible (l'item passe le filtre période).
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
  | 'returning'  // "Returning Series" — en cours
  | 'ended'      // "Ended"
  | 'canceled'   // "Canceled" / "Cancelled"
  | 'planned'    // "Planned" — annoncée
  | 'inprod'     // "In Production"
  | 'pilot'      // "Pilot"
  | 'unknown';   // null ou valeur inconnue

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
  | 'movie'        // Film classique
  | 'short'        // Court-métrage (runtime < 40 min)
  | 'documentary'  // Documentaire (film ou série)
  | 'tv'           // Série TV live-action
  | 'anime'        // Animation japonaise (films ou séries)
  | 'animation'    // Animation non-japonaise (Disney, Pixar, etc.)
  | 'miniseries'   // Série courte ≤ 8 épisodes ou 1 saison limitée
  | 'reality'      // Télé-réalité, concours
  | 'talk'         // Talk shows, late night
  | 'news'         // Journaux, news TV
  | 'special';     // Épisode spécial, concert, stand-up

/** Pairs each ContentKind with a French label and emoji icon for use in filter chips and category headers. */
export interface ContentKindMeta {
  kind:  ContentKind;
  label: string;
  icon:  string;
}

/** Ordered list of content categories displayed in the catalog filter bar; order determines UI presentation priority. */
export const CONTENT_KINDS: ContentKindMeta[] = [
  { kind: 'movie',       label: 'Films',          icon: '🎬' },
  { kind: 'tv',          label: 'Séries',          icon: '📺' },
  { kind: 'anime',       label: 'Anime',           icon: '⛩️' },
  { kind: 'animation',   label: 'Animation',       icon: '🎨' },
  { kind: 'documentary', label: 'Documentaires',   icon: '🎥' },
  { kind: 'miniseries',  label: 'Mini-séries',     icon: '📖' },
  { kind: 'reality',     label: 'Télé-réalité',    icon: '🎭' },
  { kind: 'short',       label: 'Courts-métrages', icon: '⏱️' },
  { kind: 'special',     label: 'Spéciaux',        icon: '⭐' },
];

/** Infers a precise content kind from TMDB metadata using a strict priority chain (short > documentary > anime > ...) to avoid ambiguous multi-genre classification. */
export function classifyContentKind(item: CatalogMeta): ContentKind {
  // Normalise media_type : 'series' → 'tv' pour uniformité
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

  // Détections de genres (FR + EN, correspondance partielle robuste)
  const isAnimation   = genres.some((g) => g.includes('animation'));
  const isDocumentary = genres.some((g) => g.includes('document'));
  const isReality     = genres.some((g) =>
    g.includes('réalité') || g === 'reality' || g === 'télé-réalité'
  );
  const isTalk = genres.some((g) =>
    g.includes('talk') || g === 'talk show'
  );
  const isNews = genres.some((g) =>
    g.includes('actualit') || g === 'news'
  );

  // 1. Court-métrage
  if (mediaType === 'movie' && runtime > 0 && runtime < 40) return 'short';

  // 2. Documentaire (priorité sur animation)
  if (isDocumentary) return 'documentary';

  // 3. Réalité / Talk / News (TV)
  if (isReality) return 'reality';
  if (isTalk)    return 'talk';
  if (isNews)    return 'news';

  // 4. Anime : animation + origine japonaise OU langue japonaise
  if (
    isAnimation &&
    (originalLang === 'ja' || originCountry.includes('JP'))
  ) return 'anime';

  // 5. Animation non-japonaise
  if (isAnimation) return 'animation';

  // 6. Mini-série : 1 saison + ≤ 8 épisodes, ou série terminée courte
  if (
    mediaType === 'tv' &&
    (
      (seasonCount === 1 && episodeCount > 0 && episodeCount <= 8) ||
      (item.status?.toLowerCase() === 'ended' && episodeCount > 0 && episodeCount <= 8)
    )
  ) return 'miniseries';

  // 7. Spécial stand-up / concert
  if (
    mediaType === 'movie' &&
    (
      genres.some((g) => g === 'musique' || g === 'music') ||
      (item.title ?? item.name ?? '').toLowerCase().includes('stand-up') ||
      (item.title ?? item.name ?? '').toLowerCase().includes('concert')
    )
  ) return 'special';

  // 8. Défaut
  return mediaType === 'movie' ? 'movie' : 'tv';
}
