// SearchPage.tsx — Role: Content search page
// RULES: None

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Clock, X, TrendingUp } from 'lucide-react';
import { endpoints } from '@/shared/api/client';
import { ContentCard } from '@/features/catalog/components/ContentCard';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { QueryErrorState } from '../../../shared/components/ui/QueryErrorState';
import { useSearchHistory } from '@/shared/hooks/useSearchHistory';
import { useKidsFilter } from '@/shared/hooks/useKidsFilter';
import { useCatalogStore } from '@/features/catalog/store/catalog.store';
import type { CatalogMeta } from '../../../shared/types/index';

type FilterTab = 'all' | 'movies' | 'series';

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory();
  const { sections } = useCatalogStore();
  const { filterForKids } = useKidsFilter<CatalogMeta>();

  const popularSuggestions = useMemo((): CatalogMeta[] => {
    const trending: CatalogMeta[] = sections['trending'] ?? [];
    return filterForKids(trending)
      .filter((item: CatalogMeta) => (item.vote_average ?? 0) >= 6)
      .sort((a: CatalogMeta, b: CatalogMeta) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
      .slice(0, 10);
  }, [sections, filterForKids]);

  // Debounce 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Sync debounced query → URL ?q=
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  const { data, isLoading, isError, error, refetch } = useQuery<{ metas: CatalogMeta[] }>({
    queryKey: ['search', 'multi', debouncedQuery],
    queryFn: () => endpoints.catalog.search(debouncedQuery, 'multi').then((r) => r.data),
    enabled: !!debouncedQuery,
  });

  const allMetas: CatalogMeta[] = data?.metas ?? [];

  // Save to history when results arrive
  useEffect(() => {
    if (debouncedQuery && allMetas.length > 0) addEntry(debouncedQuery);
  }, [debouncedQuery, allMetas.length, addEntry]);

  const filteredResults: CatalogMeta[] = (() => {
    const safe = filterForKids(allMetas);
    if (activeTab === 'movies') {
      return safe.filter(
        (item) => (item.type || item.media_type) === 'movie',
      );
    }
    if (activeTab === 'series') {
      return safe.filter(
        (item) => (item.type || item.media_type) !== 'movie',
      );
    }
    return safe;
  })();

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all',    label: t('search.filterAll') },
    { id: 'movies', label: t('search.filterMovies') },
    { id: 'series', label: t('search.filterSeries') },
  ];

  return (
    <div
      className="min-h-screen pb-16"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
        paddingTop: 'calc(var(--titlebar-height) + var(--navbar-height) + 2rem)',
        paddingLeft: 'var(--section-px)',
        paddingRight: 'var(--section-px)',
      }}
    >
      {/* Search input + filter tabs */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6 text-white/90">{t('search.heading')}</h1>

        {/* Input */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-5 py-3 pr-12 rounded-xl bg-white/[0.06] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-white/20 text-lg text-white/90 placeholder-white/30 transition-colors"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              aria-label={t('common.clear')}
            >
              <X size={20} />
            </button>
          ) : (
            <SearchIcon
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
              size={22}
            />
          )}
        </div>

        {/* Filter tabs — only visible when there is a query */}
        {debouncedQuery && (
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/[0.07] text-white/55 border border-white/[0.08] hover:bg-white/[0.12]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="max-w-4xl mx-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <QueryErrorState error={error} refetch={refetch} className="mt-16" />
      )}

      {/* Empty state — show history or search hint */}
      {!isLoading && !debouncedQuery && history.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-white/40 uppercase tracking-[1.2px] font-semibold">
              {t('search.recentSearches')}
            </h2>
            <button
              onClick={clearHistory}
              className="text-xs text-white/30 hover:text-white/60 bg-transparent
                         border-none cursor-pointer transition-colors
                         duration-[var(--transition-fast)]"
            >
              {t('search.clearHistory')}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {history.map(term => (
              <div
                key={term}
                className="flex items-center justify-between group/entry rounded-lg
                           hover:bg-white/[0.04] transition-colors duration-[var(--transition-fast)]"
              >
                <button
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-3 px-3 py-2.5 flex-1 text-left
                             bg-transparent border-none cursor-pointer text-white/60
                             hover:text-white/90 transition-colors
                             duration-[var(--transition-fast)]"
                >
                  <Clock size={14} className="text-white/25 shrink-0" />
                  <span className="text-sm">{term}</span>
                </button>
                <button
                  onClick={() => removeEntry(term)}
                  aria-label="Remove"
                  className="p-2 mr-1 bg-transparent border-none cursor-pointer text-white/20
                             hover:text-white/60 opacity-0 group-hover/entry:opacity-100
                             transition-colors duration-[var(--transition-fast)]"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !debouncedQuery && history.length === 0 && (
        <div className="max-w-4xl mx-auto mt-8">
          {popularSuggestions.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-white/30" />
                <h2 className="text-xs text-white/40 uppercase tracking-[1.2px] font-semibold">
                  {t('search.popularSuggestions')}
                </h2>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {popularSuggestions.map((item) => (
                  <ContentCard key={item.id} item={item} variant="poster" />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center mt-16 gap-5 select-none">
              <SearchIcon size={72} className="text-white/10" strokeWidth={1} />
              <p className="text-xl text-white/15 text-center">{t('search.searchHint')}</p>
            </div>
          )}
        </div>
      )}

      {/* No results for this query */}
      {!isLoading && debouncedQuery && allMetas.length === 0 && (
        <EmptyState
          icon={<SearchIcon />}
          title={t('search.noResults', { query: debouncedQuery })}
          description={t('search.tryAnotherQuery', { defaultValue: 'Try a different search term or check for typos.' })}
          className="mt-16"
        />
      )}

      {/* Results */}
      {!isLoading && filteredResults.length > 0 && (
        <>
          {/* Result count */}
          <p className="text-xs text-white/40 mb-4 max-w-4xl mx-auto">
            {t('common.resultCount', { count: filteredResults.length })}
          </p>

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredResults.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                variant="poster"
              />
            ))}
          </div>
        </>
      )}

      {/* Filtered tab has no results but the raw query does */}
      {!isLoading && debouncedQuery && allMetas.length > 0 && filteredResults.length === 0 && (
        <EmptyState
          icon={<SearchIcon />}
          title={t('search.noResults', { query: debouncedQuery })}
          description={t('search.tryOtherFilter', { defaultValue: 'Try switching the filter to see all results.' })}
          className="mt-16"
        />
      )}
    </div>
  );
}
