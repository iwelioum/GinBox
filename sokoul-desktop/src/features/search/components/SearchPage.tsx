// SearchPage.tsx — Role: Content search page
// RULES: None

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { endpoints } from '@/shared/api/client';
import { ContentCard } from '@/features/catalog/components/ContentCard';
import { Spinner } from '../../../shared/components/ui/Spinner';
import type { CatalogMeta } from '../../../shared/types/index';

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: movieResults, isLoading: moviesLoading } = useQuery<{ metas: CatalogMeta[] }>({
    queryKey: ['search', 'movie', debouncedQuery],
    queryFn:  () => endpoints.catalog.search(debouncedQuery, 'movie').then((r) => r.data),
    enabled:  !!debouncedQuery,
  });

  const { data: seriesResults, isLoading: seriesLoading } = useQuery<{ metas: CatalogMeta[] }>({
    queryKey: ['search', 'series', debouncedQuery],
    queryFn:  () => endpoints.catalog.search(debouncedQuery, 'series').then((r) => r.data),
    enabled:  !!debouncedQuery,
  });

  const allResults: CatalogMeta[] = [
    ...(movieResults?.metas ?? []),
    ...(seriesResults?.metas ?? []),
  ];

  const isLoading = moviesLoading || seriesLoading;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary" style={{ paddingTop: 'calc(var(--titlebar-height) + var(--navbar-height) + 2rem)', paddingLeft: 'var(--section-px)', paddingRight: 'var(--section-px)' }}>
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6">{t('search.heading')}</h1>
        <div className="relative">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-5 py-3 rounded-md bg-bg-card border border-bg-secondary focus:outline-none focus:border-accent text-lg"
          />
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary" size={24} />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Spinner size={48} />
        </div>
      )}

      {!isLoading && debouncedQuery && allResults.length === 0 && (
        <div className="text-center text-text-secondary mt-16">
          <p>{t('search.noResults', { query: debouncedQuery })}</p>
        </div>
      )}

      {!isLoading && allResults.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          gap: '1.5rem',
        }}>
          {allResults.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              variant={item.type === 'movie' ? 'poster' : 'landscape'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
