// LibraryPage.tsx — Parcourir la bibliothèque avec filtres
// DONNÉES : popular + top_rated (films + séries), 2 pages × 2 listes initiaux
// FILTRES : Type · Genres · Période · Note/Popularité · Langue/Pays · Durée

import * as React from 'react';
import { useQueries, useQuery }          from '@tanstack/react-query';
import { endpoints }                      from '@/api/client';
import type { CatalogMeta, ContentType, UserProgressEntry } from '@/shared/types';
import { useProfileStore }                from '@/shared/stores/profileStore';
import {
  classifyContentKind,
  expandGenres,
  extractYear,
  normalizeStatus,
} from '@/shared/utils/contentKind';
import type { RawGenre }                  from '@/shared/utils/contentKind';
import {
  CatalogFilters,
  DEFAULT_FILTERS,
  YEAR_MIN,
  YEAR_MAX,
  countActiveFilters,
  type FilterState,
  type EnrichedItem,
  type SortOption,
} from '@/features/catalog/components/CatalogFilters';
import { ContentCard }                    from '@/features/catalog/components/ContentCard';
import { HoverCard }                      from '@/features/catalog/components/HoverCard';
import { useHoverCard }                   from '@/shared/hooks/useHoverCard';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';

type CatalogId = 'popular' | 'top_rated';
const CATALOG_SOURCES: { type: ContentType; id: CatalogId }[] = [
  { type: 'movie',  id: 'popular'   },
  { type: 'movie',  id: 'top_rated' },
  { type: 'series', id: 'popular'   },
  { type: 'series', id: 'top_rated' },
];
const INITIAL_PAGES = 2;
const MORE_PAGES    = 2;

const TYPE_TABS = [
  { value: 'all',   label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv',    label: 'Series' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Popularite' },
  { value: 'rating',     label: 'Note'       },
  { value: 'year_desc',  label: 'Plus recent' },
  { value: 'year_asc',   label: 'Plus ancien' },
  { value: 'title_asc',  label: 'A - Z'       },
  { value: 'title_desc', label: 'Z - A'       },
];

const KIND_LABELS: Record<string, string> = {
  movie:       'Films',
  tv:          'Séries',
  anime:       'Animes',
  animation:   'Animation',
  miniseries:  'Mini-séries',
  documentary: 'Documentaires',
  reality:     'Téléréalité',
  special:     'Spéciaux',
  short:       'Courts-métrages',
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 border border-white/5">
    {label}
    <button onClick={onRemove} className="text-white/30 hover:text-white transition-colors ml-0.5">
      <X size={12} />
    </button>
  </span>
);

function medianRuntime(runtimes: number[]): number | null {
  const valid = runtimes.filter((r) => r > 0);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function applyFiltersWithoutGenres(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const [yMin, yMax] = filters.yearRange;
  const isDefaultYear = yMin === YEAR_MIN && yMax === YEAR_MAX;

  return items.filter((item) => {
    if (filters.kinds.length > 0 && !filters.kinds.includes(item._kind)) return false;

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

    if (filters.originalLanguages.length > 0 && !filters.originalLanguages.includes(item._lang)) return false;
    if (filters.countries.length > 0 && !filters.countries.some((c) => item._countries.includes(c))) return false;

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
  });
}

function applyFiltersWithoutLangCountry(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const [yMin, yMax] = filters.yearRange;
  const isDefaultYear = yMin === YEAR_MIN && yMax === YEAR_MAX;

  return items.filter((item) => {
    if (filters.kinds.length > 0 && !filters.kinds.includes(item._kind)) return false;
    if (filters.genres.length > 0 && !filters.genres.some((g) => item._genres.includes(g))) return false;

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
  });
}

function matchesAvailability(item: EnrichedItem, filters: FilterState): boolean {
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

function matchesUserStatus(item: EnrichedItem, filters: FilterState): boolean {
  if (filters.userStatuses.length === 0) return true;
  return filters.userStatuses.includes(item._userStatus);
}

function applyFiltersWithoutAvailability(
  items: EnrichedItem[],
  filters: FilterState,
): EnrichedItem[] {
  const withoutGenres = applyFiltersWithoutGenres(items, filters);
  if (filters.genres.length === 0) return withoutGenres;
  return withoutGenres.filter((item) =>
    filters.genres.some((g) => item._genres.includes(g))
  );
}

function applyFilters(items: EnrichedItem[], filters: FilterState): EnrichedItem[] {
  return applyFiltersWithoutAvailability(items, filters).filter((item) =>
    matchesAvailability(item, filters)
  );
}

export default function LibraryPage() {
  const [filters, setFilters]           = React.useState<FilterState>(DEFAULT_FILTERS);
  const [loadedPages, setLoadedPages]   = React.useState(INITIAL_PAGES);
  const [drawerOpen, setDrawerOpen]     = React.useState(false);

  // Local input state for immediate typing feedback
  const [searchInput, setSearchInput]   = React.useState(filters.searchQuery);

  // Sync searchInput with filters.searchQuery (e.g. on reset)
  React.useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  // Debounce searchInput -> filters.searchQuery (150ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(f => f.searchQuery === searchInput ? f : { ...f, searchQuery: searchInput });
    }, 150);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const activeProfile = useProfileStore((s) => s.activeProfile);
  const profileId     = activeProfile?.id ?? null;

  const { data: userProgressResponse } = useQuery({
    queryKey:  ['user-progress', profileId],
    queryFn:   () => endpoints.userProgress.list(profileId!),
    enabled:   profileId !== null,
    staleTime: 30_000,
  });

  const userProgressList = userProgressResponse?.data ?? [];

  const userProgressMap = React.useMemo(
    () => new Map<string, UserProgressEntry>(userProgressList.map((e: UserProgressEntry) => [e.contentId, e])),
    [userProgressList]
  );

  const queries = React.useMemo(
    () =>
      CATALOG_SOURCES.flatMap(({ type, id }) =>
        Array.from({ length: loadedPages }, (_, i) => ({
          queryKey:  ['library', type, id, i + 1] as const,
          queryFn:   () =>
            endpoints.catalog
              .get(type, id, { page: String(i + 1) })
              .then((r) => (r.data.metas ?? []) as CatalogMeta[]),
          staleTime: 10 * 60 * 1000,
        }))
      ),
    [loadedPages]
  );

  const results   = useQueries({ queries });
  const isLoading = results.some((r) => r.isLoading);

  const rawItems = React.useMemo(() => {
    const all: CatalogMeta[] = [];
    for (const r of results) { if (r.data) all.push(...r.data); }
    const seen = new Set<string>();
    return all.filter((item) => item.id && !seen.has(item.id) && seen.add(item.id));
  }, [results]);

  const enrichedItems = React.useMemo<EnrichedItem[]>(() => {
    // Rang popularité par type de média (films et séries séparément)
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

      // Détection "to_resume" : série terminée par l'utilisateur + nouveaux épisodes
      const isToResume =
        prog?.status === 'completed' &&
        normalizeStatus(item.status) === 'returning' &&
        item.number_of_episodes != null &&
        prog.progress < 100;

      return {
        ...item,
        _kind:          classifyContentKind(item),
        _genres:        expandGenres((item.genres ?? []) as RawGenre[]),
        _year:          extractYear(item),
        _status:        normalizeStatus(item.status),
        _lang:          item.original_language?.toLowerCase() ?? 'unknown',
        _countries:     (item.origin_country ?? []).map((c) => c.toUpperCase()),
        _rating:        (typeof va === 'number' && va > 0) ? Math.round(va * 10) / 10 : null,
        _votes:         item.vote_count ?? 0,
        _popularity:    item.popularity ?? 0,
        _popRank:       (item.type === 'movie' ? movieRankMap : showRankMap).get(item.id) ?? 9999,
        _movieRuntime:  (typeof runtime === 'number' && runtime > 0) ? runtime : null,
        _seasonCount:   item.number_of_seasons ?? null,
        _episodeCount:  item.number_of_episodes ?? null,
        _episodeRuntime: epRt ? medianRuntime(epRt) : null,
        _isLocal:     item.availability?.isLocal          ?? false,
        _isDebrid:    item.availability?.isDebridCached   ?? false,
        _providers:   item.availability?.streamingProviders ?? [],
        _isWatchable: item.availability?.isWatchableNow   ?? false,
        _providerIds: (item.availability?.streamingProviders ?? []).map((p) => p.id),
        _userStatus:   isToResume ? 'to_resume' : (prog?.status ?? 'unwatched'),
        _userProgress: prog?.progress ?? 0,
        _userRating:   prog?.rating ?? null,
      };
    });
  }, [rawItems, userProgressMap]);

  const genreItems = React.useMemo(
    () => applyFiltersWithoutGenres(enrichedItems, filters),
    [enrichedItems, filters]
  );

  const langCountryItems = React.useMemo(
    () => applyFiltersWithoutLangCountry(enrichedItems, filters),
    [enrichedItems, filters]
  );

  const availabilityItems = React.useMemo(
    () => applyFiltersWithoutAvailability(enrichedItems, filters),
    [enrichedItems, filters]
  );

  const filteredItems = React.useMemo(() => {
    let list = applyFilters(enrichedItems, filters);

    // 1. Recherche locale
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      list = list.filter((item) =>
        (item.title ?? item.name ?? '').toLowerCase().includes(q)
      );
    }

    // 2. Tri
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

  const activeFiltersCount = React.useMemo(() => countActiveFilters(filters), [filters]);

  const currentKindTab = React.useMemo(() => {
    if (filters.kinds.length === 0) return 'all';
    if (filters.kinds.length === 1 && filters.kinds[0] === 'movie') return 'movie';
    const seriesKinds = ['tv', 'anime', 'animation', 'miniseries'] as const;
    if (filters.kinds.length === seriesKinds.length && seriesKinds.every(k => filters.kinds.includes(k))) return 'tv';
    return 'custom';
  }, [filters.kinds]);

  const handleTabClick = (val: string) => {
    if (val === 'all') setFilters(f => ({ ...f, kinds: [] }));
    else if (val === 'movie') setFilters(f => ({ ...f, kinds: ['movie'] }));
    else if (val === 'tv') setFilters(f => ({ ...f, kinds: ['tv', 'anime', 'animation', 'miniseries'] }));
  };

  const canLoadMore = loadedPages < 8;

  return (
    <div
      className="flex flex-col min-h-screen bg-[#0A0E1A] text-white"
      style={{ paddingTop: 'var(--navbar-height)' }}
    >
      <main className="flex-1 min-w-0 p-8 flex flex-col">
        
        <div className="sticky top-[var(--navbar-height)] z-30 -mx-8 -mt-8 mb-4 px-8 py-4
                        bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/[0.05]
                        flex items-center justify-between gap-6"
             style={{ top: 'calc(var(--navbar-height) - 1px)' }}>
          
          {/* Tabs de type rapide */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {TYPE_TABS.map((tab) => {
              const isActive = currentKindTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${isActive 
                      ? 'bg-white text-black shadow-lg shadow-black/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 flex items-center gap-4 max-w-2xl">
            {/* Bouton Filtres */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg
                text-sm font-semibold transition-all border
                ${activeFiltersCount > 0
                  ? 'bg-white/15 border-white/40 text-white'
                  : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
            >
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5
                                 bg-blue-500 text-white text-[10px] font-bold
                                 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Barre de recherche locale */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Chercher dans ces résultats..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-10 
                           text-sm outline-none focus:bg-white/10 focus:border-white/20 transition-all
                           placeholder:text-white/20"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                             rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative group">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as SortOption }))}
                className="appearance-none bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-10
                           text-sm text-white/60 hover:bg-white/10 transition-all outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#0d0f1a] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 px-2 py-2 mb-4 flex-wrap border-b border-white/[0.03]">
            <span className="text-xs text-white/30 mr-2">
              {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}
            </span>
            
            {filters.kinds.length > 0 && (
              <FilterChip
                label={filters.kinds.map(k => KIND_LABELS[k]).join(', ')}
                onRemove={() => setFilters(f => ({ ...f, kinds: [] }))}
              />
            )}
            {filters.genres.length > 0 && (
              <FilterChip
                label={filters.genres.join(', ')}
                onRemove={() => setFilters(f => ({ ...f, genres: [] }))}
              />
            )}
            {(filters.yearRange[0] !== YEAR_MIN || filters.yearRange[1] !== YEAR_MAX) && (
              <FilterChip
                label={`${filters.yearRange[0]}–${filters.yearRange[1] === YEAR_MAX ? 'Aujourd\'hui' : filters.yearRange[1]}`}
                onRemove={() => setFilters(f => ({ ...f, yearRange: [YEAR_MIN, YEAR_MAX] }))}
              />
            )}
            {filters.ratingMin > 0 && (
              <FilterChip
                label={`≥ ${filters.ratingMin} ★`}
                onRemove={() => setFilters(f => ({ ...f, ratingMin: 0 }))}
              />
            )}
            {filters.originalLanguages.length > 0 && (
              <FilterChip
                label={filters.originalLanguages.join(', ').toUpperCase()}
                onRemove={() => setFilters(f => ({ ...f, originalLanguages: [] }))}
              />
            )}
            {filters.availSources.length > 0 && (
              <FilterChip
                label="Disponibilité"
                onRemove={() => setFilters(f => ({ ...f, availSources: [] }))}
              />
            )}

            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs text-red-400/60 hover:text-red-400 ml-2 transition-colors font-medium"
            >
              Tout effacer
            </button>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Parcourir</h1>
          {!isLoading && activeFiltersCount === 0 && (
            <p className="text-sm text-white/40">
              {filteredItems.length} titre{filteredItems.length !== 1 ? 's' : ''}
              {enrichedItems.length !== filteredItems.length && (
                <span> sur {enrichedItems.length}</span>
              )}
            </p>
          )}
        </div>

        {isLoading && rawItems.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <Search className="w-12 h-12 mb-4 text-white/20" />
            <p className="text-base font-medium">Aucun résultat pour ces filtres</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 text-sm text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {filteredItems.map((item) => (
                <ContentCard key={item.id} item={item} variant="poster" />
              ))}
            </div>
            {canLoadMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setLoadedPages((p) => p + MORE_PAGES)}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-full border border-white/20 text-sm text-white/70 hover:border-white/50 hover:text-white transition-all disabled:opacity-40"
                >
                  {isLoading ? 'Chargement…' : 'Charger plus'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panneau */}
          <div className="fixed right-0 top-0 h-full w-[380px] z-[101]
                          bg-[#0d0f1a] border-l border-white/10
                          flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5
                            border-b border-white/10">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Filtres</h2>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500 text-[10px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              <CatalogFilters
                allItems={enrichedItems}
                genreItems={genreItems}
                langCountryItems={langCountryItems}
                availabilityItems={availabilityItems}
                filters={filters}
                onChange={setFilters}
                profileActive={activeProfile !== null}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-5
                            border-t border-white/10 bg-[#0d0f1a]">
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-sm font-medium text-white/40 hover:text-white transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-6 py-2.5 bg-white text-black rounded-xl
                           text-sm font-bold hover:bg-white/90 transition-all shadow-lg active:scale-95"
              >
                Voir {filteredItems.length} résultats
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
