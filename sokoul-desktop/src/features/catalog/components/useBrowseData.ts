// useBrowseData.ts — Data fetching, enrichment, and filter computations

import * as React from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { endpoints }            from '@/shared/api/client';
import type { CatalogMeta, ContentType, UserProgressEntry, PlaybackEntry, Profile } from '@/shared/types';
import { useProfileStore }      from '@/stores/profileStore';
import { useKidsFilter }        from '@/shared/hooks/useKidsFilter';
import {
  classifyContentKind,
  expandGenres,
  extractYear,
  normalizeStatus,
} from '@/shared/utils/contentKind';
import type { RawGenre }        from '@/shared/utils/contentKind';
import {
  countActiveFilters,
  type FilterState,
  type EnrichedItem,
} from '@/features/catalog/components/CatalogFilters';
import {
  CATALOG_SOURCES,
  type BrowsePageMode,
} from './browseConstants';
import {
  medianRuntime,
  applyFiltersWithoutGenres,
  applyFiltersWithoutLangCountry,
  applyFiltersWithoutAvailability,
  applyFilters,
  resolveContentTypeFromItem,
} from './browseUtils';

export interface BrowseData {
  enrichedItems:      EnrichedItem[];
  filteredItems:      EnrichedItem[];
  genreItems:         EnrichedItem[];
  langCountryItems:   EnrichedItem[];
  availabilityItems:  EnrichedItem[];
  activeFiltersCount: number;
  isLoading:          boolean;
  isError:            boolean;
  refetch:            () => void;
  rawItems:           CatalogMeta[];
  playbackHistoryMap: Map<string, PlaybackEntry>;
  userProgressMap:    Map<string, UserProgressEntry>;
  activeProfile:      Profile | null;
  resolveItemType:    (item: Pick<CatalogMeta, 'type' | 'media_type'>) => ContentType;
}

export function useBrowseData(
  mode: BrowsePageMode,
  filters: FilterState,
  loadedPages: number,
): BrowseData {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const profileId     = activeProfile?.id ?? null;
  const { filterForKids } = useKidsFilter<CatalogMeta>();

  const resolveItemType = React.useCallback(
    (item: Pick<CatalogMeta, 'type' | 'media_type'>): ContentType =>
      resolveContentTypeFromItem(item, mode),
    [mode],
  );

  /* ─── User progress ─── */
  const { data: userProgressResponse } = useQuery({
    queryKey:  ['user-progress', profileId],
    queryFn:   () => endpoints.userProgress.list(profileId!),
    enabled:   profileId !== null,
    staleTime: 30_000,
  });
  const userProgressList = userProgressResponse?.data ?? [];
  const userProgressMap = React.useMemo(
    () => new Map<string, UserProgressEntry>(userProgressList.map((e: UserProgressEntry) => [e.contentId, e])),
    [userProgressList],
  );

  /* ─── Playback history ─── */
  const { data: playbackHistoryRes } = useQuery({
    queryKey:  ['playback-history', profileId],
    queryFn:   () => endpoints.playback.history(profileId!, 50).then(r => r.data),
    enabled:   profileId !== null,
    staleTime: 30_000,
  });
  const playbackHistoryMap = React.useMemo(() => {
    const map = new Map<string, PlaybackEntry>();
    for (const e of (playbackHistoryRes ?? [])) {
      const key = e.contentId.includes(':') ? e.contentId.split(':').pop() ?? e.contentId : e.contentId;
      if (!map.has(key)) map.set(key, e);
    }
    return map;
  }, [playbackHistoryRes]);

  /* ─── Catalog queries ─── */
  const catalogSources = React.useMemo(() => {
    if (mode === 'movie')  return CATALOG_SOURCES.filter(({ type }) => type === 'movie');
    if (mode === 'series') return CATALOG_SOURCES.filter(({ type }) => type === 'series');
    return CATALOG_SOURCES;
  }, [mode]);

  const queries = React.useMemo(
    () =>
      catalogSources.flatMap(({ type, id }) =>
        Array.from({ length: loadedPages }, (_, i) => ({
          queryKey:  ['library', type, id, i + 1] as const,
          queryFn:   () =>
            endpoints.catalog
              .get(type, id, { page: String(i + 1) })
              .then((r) => (r.data.metas ?? []) as CatalogMeta[]),
          staleTime: 10 * 60 * 1000,
        })),
      ),
    [catalogSources, loadedPages],
  );

  const results   = useQueries({ queries });
  const isLoading = results.some((r) => r.isLoading);
  const isError   = results.some((r) => r.isError);
  const refetch   = React.useCallback(() => results.forEach((r) => r.refetch()), [results]);

  const rawItems = React.useMemo(() => {
    const all: CatalogMeta[] = [];
    for (const r of results) { if (r.data) all.push(...r.data); }
    const seen = new Set<string>();
    const deduped = all.filter((item) => item.id && !seen.has(item.id) && seen.add(item.id));
    return filterForKids(deduped);
  }, [results, filterForKids]);

  /* ─── Enrichment ─── */
  const enrichedItems = React.useMemo<EnrichedItem[]>(() => {
    const moviesByPop  = [...rawItems].filter((i) => i.type === 'movie')
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const seriesByPop  = [...rawItems].filter((i) => i.type !== 'movie')
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const movieRankMap = new Map(moviesByPop.map((item, i) => [item.id, i + 1]));
    const showRankMap  = new Map(seriesByPop.map((item, i) => [item.id, i + 1]));

    return rawItems.map((item) => {
      const va      = item.vote_average;
      const runtime = item.runtime;
      const epRt    = item.episode_run_time;
      const rawType   = item.type || item.media_type || 'movie';
      const mediaType = rawType === 'series' ? 'tv' : rawType;
      const contentId = `${mediaType}:${item.id}`;
      const prog      = userProgressMap.get(contentId);

      const isToResume =
        prog?.status === 'completed' &&
        normalizeStatus(item.status) === 'returning' &&
        item.number_of_episodes != null &&
        prog.progress < 100;

      return {
        ...item,
        _kind:           classifyContentKind(item),
        _genres:         expandGenres((item.genres ?? []) as RawGenre[]),
        _year:           extractYear(item),
        _status:         normalizeStatus(item.status),
        _lang:           item.original_language?.toLowerCase() ?? 'unknown',
        _countries:      (item.origin_country ?? []).map((c) => c.toUpperCase()),
        _rating:         (typeof va === 'number' && va > 0) ? Math.round(va * 10) / 10 : null,
        _votes:          item.vote_count ?? 0,
        _popularity:     item.popularity ?? 0,
        _popRank:        (item.type === 'movie' ? movieRankMap : showRankMap).get(item.id) ?? 9999,
        _movieRuntime:   (typeof runtime === 'number' && runtime > 0) ? runtime : null,
        _seasonCount:    item.number_of_seasons ?? null,
        _episodeCount:   item.number_of_episodes ?? null,
        _episodeRuntime: epRt ? medianRuntime(epRt) : null,
        _isLocal:        item.availability?.isLocal           ?? false,
        _isDebrid:       item.availability?.isDebridCached    ?? false,
        _providers:      item.availability?.streamingProviders ?? [],
        _isWatchable:    item.availability?.isWatchableNow    ?? false,
        _providerIds:    (item.availability?.streamingProviders ?? []).map((p) => p.id),
        _userStatus:     isToResume ? 'to_resume' : (prog?.status ?? 'unwatched'),
        _userProgress:   playbackHistoryMap.get(item.id)?.progressPct ?? prog?.progress ?? 0,
        _userRating:     prog?.rating ?? null,
      };
    });
  }, [rawItems, userProgressMap, playbackHistoryMap]);

  /* ─── Filtered views (for CatalogFilters facet counts) ─── */
  const genreItems = React.useMemo(
    () => applyFiltersWithoutGenres(enrichedItems, filters),
    [enrichedItems, filters],
  );
  const langCountryItems = React.useMemo(
    () => applyFiltersWithoutLangCountry(enrichedItems, filters),
    [enrichedItems, filters],
  );
  const availabilityItems = React.useMemo(
    () => applyFiltersWithoutAvailability(enrichedItems, filters),
    [enrichedItems, filters],
  );

  /* ─── Final filtered + sorted list ─── */
  const filteredItems = React.useMemo(() => {
    let list = applyFilters(enrichedItems, filters);

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter((item) =>
        (item.title ?? item.name ?? '').toLowerCase().includes(q),
      );
    }

    list = [...list].sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b._rating ?? 0) - (a._rating ?? 0);
        case 'year_desc':
          return (b._year ?? 0) - (a._year ?? 0);
        case 'year_asc':
          return (a._year ?? 0) - (b._year ?? 0);
        case 'title_asc':
          return (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? '');
        case 'title_desc':
          return (b.title ?? b.name ?? '').localeCompare(a.title ?? a.name ?? '');
        case 'popularity':
        default:
          return (b._popularity ?? 0) - (a._popularity ?? 0);
      }
    });

    return list;
  }, [enrichedItems, filters]);

  const activeFiltersCount = React.useMemo(() => {
    if (mode === 'all') return countActiveFilters(filters);
    return countActiveFilters({ ...filters, kinds: [] });
  }, [filters, mode]);

  return {
    enrichedItems,
    filteredItems,
    genreItems,
    langCountryItems,
    availabilityItems,
    activeFiltersCount,
    isLoading,
    isError,
    refetch,
    rawItems,
    playbackHistoryMap,
    userProgressMap,
    activeProfile,
    resolveItemType,
  };
}

