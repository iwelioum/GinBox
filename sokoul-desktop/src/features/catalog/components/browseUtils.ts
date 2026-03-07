// browseUtils.ts — Pure utility functions for BrowsePage filtering & sorting

import type { CatalogMeta, ContentType } from '@/shared/types';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { YEAR_MIN, YEAR_MAX } from '@/features/catalog/components/CatalogFilters';
import type { FilterState, EnrichedItem } from '@/features/catalog/components/CatalogFilters';
import type { BrowsePageMode } from './browseConstants';

/* ─── Artwork helpers ─── */

export function resolveCardArtwork(item: EnrichedItem): string | null {
  const artwork = item.backdrop_path || item.background || item.poster_path || item.poster;
  if (!artwork) return null;
  if (artwork.startsWith('http')) return artwork;
  return `${TMDB_IMAGE_BASE}w500${artwork.startsWith('/') ? '' : '/'}${artwork}`;
}

export function resolveContentTypeFromItem(
  item: Pick<CatalogMeta, 'type' | 'media_type'>,
  mode: BrowsePageMode,
): ContentType {
  const rawType = (item.type ?? item.media_type ?? (mode === 'movie' ? 'movie' : 'series')).toString().toLowerCase();
  return rawType === 'movie' ? 'movie' : 'series';
}

/* ─── Stats ─── */

export function medianRuntime(runtimes: number[]): number | null {
  const valid = runtimes.filter((r) => r > 0);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/* ─── Availability & user-status matchers ─── */

export function matchesAvailability(item: EnrichedItem, filters: FilterState): boolean {
  if (filters.watchableNow && !item._isWatchable) return false;

  if (filters.availSources.length > 0) {
    const hasLocal  = filters.availSources.includes('local')     && item._isLocal;
    const hasDebrid = filters.availSources.includes('debrid')    && item._isDebrid;
    const hasStream = filters.availSources.includes('streaming') && item._providers.length > 0;
    if (!hasLocal && !hasDebrid && !hasStream) return false;
  }

  if (filters.selectedProviders.length > 0) {
    if (!filters.selectedProviders.some((id) => item._providerIds.includes(id))) return false;
  }

  if (filters.streamingType !== 'all' && item._providers.length > 0) {
    if (filters.streamingType === 'sub') {
      if (!item._providers.some((p) => p.type === 'sub')) return false;
    } else if (filters.streamingType === 'rent_buy') {
      if (!item._providers.some((p) => p.type === 'rent' || p.type === 'buy')) return false;
    }
  }

  return true;
}

export function matchesUserStatus(item: EnrichedItem, filters: FilterState): boolean {
  if (filters.userStatuses.length === 0) return true;
  return filters.userStatuses.includes(item._userStatus);
}

/* ─── Shared filter predicates (excl. specific dimensions) ─── */

function sharedPredicates(
  item: EnrichedItem,
  filters: FilterState,
  skipKinds: boolean,
  skipGenres: boolean,
  skipLangCountry: boolean,
): boolean {
  if (!skipKinds && filters.kinds.length > 0 && !filters.kinds.includes(item._kind)) return false;

  if (!skipGenres && filters.genres.length > 0 && !filters.genres.some((g) => item._genres.includes(g))) return false;

  const [yMin, yMax] = filters.yearRange;
  const isDefaultYear = yMin === YEAR_MIN && yMax === YEAR_MAX;
  if (!isDefaultYear && item._year !== null) {
    if (item._year < yMin || item._year > yMax) return false;
  }

  if (filters.seriesStatuses.length > 0 && item._kind !== 'movie' && item._kind !== 'short') {
    if (!filters.seriesStatuses.includes(item._status)) return false;
  }

  if (filters.ratingMin > 0) {
    if (item._rating === null || item._rating < filters.ratingMin) return false;
  }

  if (filters.votesMin > 0 && item._votes < filters.votesMin) return false;

  if (filters.popularityTopN !== null && item._popRank > filters.popularityTopN) return false;

  if (!skipLangCountry) {
    if (filters.originalLanguages.length > 0 && !filters.originalLanguages.includes(item._lang)) return false;
    if (filters.countries.length > 0 && !filters.countries.some((c) => item._countries.includes(c))) return false;
  }

  if (filters.movieRuntimeRange !== null) {
    const isMovieLike = item._kind === 'movie' || item._kind === 'short';
    if (isMovieLike && item._movieRuntime !== null) {
      const [min, max] = filters.movieRuntimeRange;
      if (item._movieRuntime < min || item._movieRuntime > max) return false;
    }
  }

  if (filters.seasonsRange !== null) {
    const isSeries = item._kind !== 'movie' && item._kind !== 'short';
    if (isSeries && item._seasonCount !== null) {
      const [min, max] = filters.seasonsRange;
      if (item._seasonCount < min || item._seasonCount > max) return false;
    }
  }

  if (filters.episodeRtRange !== null) {
    const isSeries = item._kind !== 'movie' && item._kind !== 'short';
    if (isSeries && item._episodeRuntime !== null) {
      const [min, max] = filters.episodeRtRange;
      if (item._episodeRuntime < min || item._episodeRuntime > max) return false;
    }
  }

  if (!matchesAvailability(item, filters)) return false;
  if (!matchesUserStatus(item, filters)) return false;

  return true;
}

/* ─── Dimension-specific filter views (for CatalogFilters facets) ─── */

export function applyFiltersWithoutGenres(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  return items.filter((item) => sharedPredicates(item, filters, false, true, false));
}

export function applyFiltersWithoutLangCountry(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  return items.filter((item) => sharedPredicates(item, filters, false, false, true));
}

export function applyFiltersWithoutAvailability(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const withoutGenres = applyFiltersWithoutGenres(items, filters);
  if (filters.genres.length === 0) return withoutGenres;
  return withoutGenres.filter((item) =>
    filters.genres.some((g) => item._genres.includes(g))
  );
}

export function applyFilters(items: EnrichedItem[], filters: FilterState): EnrichedItem[] {
  return applyFiltersWithoutAvailability(items, filters).filter((item) =>
    matchesAvailability(item, filters)
  );
}
