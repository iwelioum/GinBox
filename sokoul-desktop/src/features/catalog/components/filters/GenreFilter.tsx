import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GENRE_VISIBLE_LIMIT } from '../catalogFilterConstants';
import type { EnrichedItem, FilterSectionProps } from '../catalogFilterTypes';

interface GenreFilterProps extends FilterSectionProps {
  genreItems: EnrichedItem[];
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  genreItems, filters, onChange,
}) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = React.useState(false);

  const availableGenres = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of genreItems) {
      for (const g of item._genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [genreItems]);

  const displayedGenres = React.useMemo(() => {
    if (showAll) return availableGenres;
    const top    = availableGenres.slice(0, GENRE_VISIBLE_LIMIT);
    const topSet = new Set(top.map((g) => g.name));
    const extras = filters.genres
      .filter((g) => !topSet.has(g))
      .map((name) => availableGenres.find((ag) => ag.name === name) ?? { name, count: 0 });
    return [...top, ...extras];
  }, [availableGenres, showAll, filters.genres]);

  const hasMore = availableGenres.length > GENRE_VISIBLE_LIMIT;

  const toggleGenre = (g: string) =>
    onChange({
      ...filters,
      genres: filters.genres.includes(g)
        ? filters.genres.filter((x) => x !== g)
        : [...filters.genres, g],
    });

  if (availableGenres.length === 0) return null;

  return (
    <section>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {t('filters.genres')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayedGenres.map(({ name, count }) => {
          const active = filters.genres.includes(name);
          return (
            <button key={name} onClick={() => toggleGenre(name)}
              className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                active 
                  ? 'bg-accent text-white font-medium' 
                  : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
              }`}
            >
              {name}
              <span className={`text-xs font-mono ${active ? 'text-white/70' : 'text-text-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs text-text-muted hover:text-accent transition-colors"
        >
          {showAll
            ? t('common.showLess')
            : t('common.showAllCount', { count: availableGenres.length })}
        </button>
      )}
    </section>
  );
};
