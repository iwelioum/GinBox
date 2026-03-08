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
import { CatalogFilters }           from './CatalogFilters';

/* ═══════════════════════════════════════════════════════════
   BrowsePage — main page component (composes sub-components)
   ═══════════════════════════════════════════════════════════ */

export default function BrowsePage({ mode = 'all' }: { mode?: BrowsePageMode }) {
  const navigate = useNavigate();
  const { t }    = useTranslation();

  const [filters, setFilters]         = React.useState<FilterState>(() => buildDefaultFilters(mode));
  const [loadedPages, setLoadedPages] = React.useState(INITIAL_PAGES);
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
    <div
      className="min-h-screen bg-bg-base text-text-primary"
      style={{ paddingTop: 'var(--navbar-height)' }}
    >
      {!isSearching && (
        <BrowseHero items={filteredItems} onPlay={openSources} onInfo={openDetails} />
      )}

      <main className="flex flex-row gap-6" style={{ padding: 'var(--space-lg) var(--section-px)' }}>
        {/* Filter Sidebar */}
        <aside className="w-[260px] shrink-0 sticky top-4 h-fit">
          <div className="bg-bg-elevated border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs uppercase text-text-muted tracking-widest">
                {t('filters.heading')}
              </h2>
              <button
                onClick={resetFilters}
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                {t('filters.reset')}
              </button>
            </div>
            
            <CatalogFilters
              allItems={enrichedItems}
              genreItems={genreItems}
              langCountryItems={langCountryItems}
              availabilityItems={availabilityItems}
              filters={filters}
              onChange={setScopedFilters}
              profileActive={activeProfile !== null}
            />
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <BrowseFiltersBar
            mode={mode}
            filters={filters}
            filteredCount={filteredItems.length}
            activeFiltersCount={activeFiltersCount}
            currentKindTab={currentKindTab}
            onTabClick={handleTabClick}
            onOpenDrawer={() => {}} // No-op since sidebar is always visible
            onChangeFilters={setScopedFilters}
          />

          {!isLoading && contentSections.length > 0 && !isSearching && (
            <div className="mb-6">
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

          {isLoading && rawItems.length === 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 transition-all duration-300">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-lg bg-bg-elevated animate-pulse" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyBrowseState mode={mode} onReset={setScopedFilters} />
          ) : isSearching ? (
            <>
              <div
                ref={resultsSectionRef}
                className="grid scroll-mt-24 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 transition-all duration-300"
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
                    className="px-8 py-3 rounded-full border border-[var(--color-border)] text-sm text-text-secondary hover:border-accent hover:text-accent transition-all disabled:opacity-40"
                  >
                    {isLoading ? t('common.loading') : t('browse.loadMore')}
                  </button>
                </div>
              )}
            </>
          ) : (
            canLoadMore && !isLoading ? (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setLoadedPages((p) => p + MORE_PAGES)}
                  className="px-8 py-3 rounded-full border border-[var(--color-border)] text-sm text-text-secondary hover:border-accent hover:text-accent transition-all"
                >
                  {t('browse.loadMoreTitles')}
                </button>
              </div>
            ) : null
          )}
        </div>
      </main>
    </div>
  );
}
