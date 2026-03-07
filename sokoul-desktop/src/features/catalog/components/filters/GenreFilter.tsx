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
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
        {t('filters.genres')}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {displayedGenres.map(({ name, count }) => {
          const active = filters.genres.includes(name);
          return (
            <button key={name} onClick={() => toggleGenre(name)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 whitespace-nowrap flex items-center gap-1 ${
                active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
              }`}
            >
              {name}
              <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <button onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-[11px] text-white/35 hover:text-white/70 transition-colors"
        >
          {showAll
            ? t('common.showLess')
            : t('common.showAllCount', { count: availableGenres.length })}
        </button>
      )}
    </section>
  );
};
