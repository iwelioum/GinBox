// BrowsePage.tsx — Browse library with filters (composed from sub-components)

import * as React from 'react';
import { useNavigate }       from 'react-router-dom';
import { useTranslation }    from 'react-i18next';
import type { CatalogMeta }  from '@/shared/types';
import type { FilterState }  from '@/features/catalog/components/CatalogFilters';
import { ContentCard }       from '@/features/catalog/components/ContentCard';
import { HoverCard }         from '@/features/catalog/components/HoverCard';
import { useHoverCard }      from '@/shared/hooks/useHoverCard';
import {
  INITIAL_PAGES,
  MORE_PAGES,
  type BrowsePageMode,
  type ContentTabValue,
  buildDefaultFilters,
  getKindsForMode,
} from './browseConstants';
import { useBrowseData }            from './useBrowseData';
import { buildContentSections }     from './buildContentSections';
import { BrowseHero }               from './BrowseHero';
import { BrowseFiltersBar }         from './BrowseFiltersBar';
import { ContentSection }           from './ContentSection';
import { EmptyBrowseState }         from './EmptyBrowseState';
import { FilterDrawer }             from './FilterDrawer';
import { QueryErrorState }          from '@/shared/components/ui/QueryErrorState';
import { Skeleton }                 from '@/shared/components/ui';

/* ═══════════════════════════════════════════════════════════
   BrowsePage — main page component (composes sub-components)
   ═══════════════════════════════════════════════════════════ */

export default function BrowsePage({ mode = 'all' }: { mode?: BrowsePageMode }) {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  const [filters, setFilters]         = React.useState<FilterState>(() => buildDefaultFilters(mode));
  const [loadedPages, setLoadedPages] = React.useState(INITIAL_PAGES);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const { itemId, anchorRect, onEnter, onLeave } = useHoverCard(300);
  const scopedKinds       = React.useMemo(() => getKindsForMode(mode), [mode]);
  const resultsSectionRef = React.useRef<HTMLDivElement | null>(null);

  /* ─── Data hook ─── */
  const {
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
    activeProfile,
    resolveItemType,
  } = useBrowseData(mode, filters, loadedPages);

  /* ─── Navigation helpers ─── */
  const openDetails = React.useCallback((item: CatalogMeta) => {
    const normalizedType = resolveItemType(item);
    navigate(`/detail/${normalizedType}/${encodeURIComponent(item.id)}`);
  }, [navigate, resolveItemType]);

  const openSources = React.useCallback((item: CatalogMeta) => {
    const normalizedType = resolveItemType(item);
    navigate(`/sources/${normalizedType}/${encodeURIComponent(item.id)}`);
  }, [navigate, resolveItemType]);

  /* ─── Scoped filter setter (locks kinds in movie/series mode) ─── */
  const setScopedFilters = React.useCallback((next: React.SetStateAction<FilterState>) => {
    setFilters((prev) => {
      const resolved =
        typeof next === 'function'
          ? (next as (value: FilterState) => FilterState)(prev)
          : next;
      if (mode === 'all') return resolved;
      return { ...resolved, kinds: [...scopedKinds] };
    });
  }, [mode, scopedKinds]);

  /* ─── Search debounce ─── */
  const [searchInput, setSearchInput] = React.useState(filters.searchQuery);

  React.useEffect(() => {
    setFilters(buildDefaultFilters(mode));
    setLoadedPages(INITIAL_PAGES);
  }, [mode]);

  React.useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setScopedFilters(f => f.searchQuery === searchInput ? f : { ...f, searchQuery: searchInput });
    }, 150);
    return () => clearTimeout(handler);
  }, [searchInput, setScopedFilters]);

  /* ─── Kind tab state ─── */
  const currentKindTab = React.useMemo(() => {
    if (filters.kinds.length === 0) return 'all';
    const movieKinds  = ['movie', 'short', 'documentary'] as const;
    const seriesKinds = ['tv', 'anime', 'animation', 'miniseries'] as const;
    if (filters.kinds.length === movieKinds.length && movieKinds.every(k => filters.kinds.includes(k))) return 'movie';
    if (filters.kinds.length === seriesKinds.length && seriesKinds.every(k => filters.kinds.includes(k))) return 'tv';
    return 'custom';
  }, [filters.kinds]);

  const handleTabClick = (val: ContentTabValue) => {
    if (val === 'all')        setScopedFilters(f => ({ ...f, kinds: [] }));
    else if (val === 'movie') setScopedFilters(f => ({ ...f, kinds: ['movie', 'short', 'documentary'] }));
    else if (val === 'tv')    setScopedFilters(f => ({ ...f, kinds: ['tv', 'anime', 'animation', 'miniseries'] }));
  };

  const resetFilters = React.useCallback(() => {
    setFilters(buildDefaultFilters(mode));
  }, [mode]);

  /* ─── Content sections ─── */
  const contentSections = React.useMemo(
    () => buildContentSections(filteredItems, mode, t),
    [filteredItems, mode, t],
  );

  const canLoadMore = loadedPages < 8;
  const isSearching = filters.searchQuery.trim().length > 0;

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      {/* Full-width hero (extends behind navbar, no padding-top) */}
      {!isSearching && (
        <BrowseHero items={filteredItems} onPlay={openSources} onInfo={openDetails} />
      )}

      {/* Content rails section with slight overlap for depth */}
      <div className="relative z-10 -mt-20">
        <div className="px-[--section-px] space-y-6">
          
          {/* Filter bar at top: tabs + filter button that opens drawer */}
          <BrowseFiltersBar
            mode={mode}
            filters={filters}
            filteredCount={filteredItems.length}
            activeFiltersCount={activeFiltersCount}
            currentKindTab={currentKindTab}
            onTabClick={handleTabClick}
            onOpenDrawer={() => setIsFilterDrawerOpen(true)}
            onChangeFilters={setScopedFilters}
          />

          {/* Content sections as rails (same as HomePage) when not searching */}
          {!isLoading && contentSections.length > 0 && !isSearching && (
            <div className="space-y-6">
              {contentSections.map((section) => (
                <ContentSection
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  accentColor={section.accentColor}
                  icon={section.icon}
                  items={section.items}
                  showProgress={section.showProgress}
                  onOpen={openDetails}
                  playbackLookup={section.id === 'continue' ? playbackHistoryMap : undefined}
                />
              ))}
            </div>
          )}

          {/* Loading state */}
          {isLoading && rawItems.length === 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && rawItems.length === 0 && (
            <QueryErrorState error={null} refetch={refetch} />
          )}

          {/* Empty state */}
          {!isLoading && !isError && filteredItems.length === 0 && (
            <EmptyBrowseState mode={mode} onReset={setScopedFilters} />
          )}

          {/* Grid of results when searching/filtering */}
          {isSearching && filteredItems.length > 0 && (
            <>
              <div
                ref={resultsSectionRef}
                className="grid scroll-mt-24 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
              >
                {filteredItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    variant="poster"
                    onHoverEnter={onEnter}
                    onHoverLeave={onLeave}
                  />
                ))}
              </div>

              {itemId !== null && anchorRect !== null && (() => {
                const hoverItem = filteredItems.find((i) => i.id === String(itemId));
                return hoverItem
                  ? <HoverCard item={hoverItem} anchorRect={anchorRect} onLeave={onLeave} />
                  : null;
              })()}

              {canLoadMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setLoadedPages((p) => p + MORE_PAGES)}
                    disabled={isLoading}
                    className="px-8 py-3 rounded-full border border-[--color-border] text-sm text-[--color-text-secondary] hover:border-[--color-accent] hover:text-[--color-accent] transition-colors disabled:opacity-40"
                  >
                    {isLoading ? t('common.loading') : t('browse.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Load more when browsing (not searching) */}
          {!isSearching && !isLoading && canLoadMore && contentSections.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setLoadedPages((p) => p + MORE_PAGES)}
                className="px-8 py-3 rounded-full border border-[--color-border] text-sm text-[--color-text-secondary] hover:border-[--color-accent] hover:text-[--color-accent] transition-colors"
              >
                {t('browse.loadMoreTitles')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Drawer */}
      {isFilterDrawerOpen && (
        <FilterDrawer
          mode={mode}
          filters={filters}
          enrichedItems={enrichedItems}
          genreItems={genreItems}
          langCountryItems={langCountryItems}
          availabilityItems={availabilityItems}
          filteredCount={filteredItems.length}
          activeFiltersCount={activeFiltersCount}
          profileActive={activeProfile !== null}
          onChangeFilters={setScopedFilters}
          onClose={() => setIsFilterDrawerOpen(false)}
        />
      )}
    </div>
  );
}

