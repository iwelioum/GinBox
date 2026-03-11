// components/detail/SimilarSection.tsx — Poster card grid with rating overlays
// Kids filter · Navigation · Hover play indicator

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { useKidsFilter } from '@/shared/hooks/useKidsFilter';

interface SimilarSectionProps {
  items?: CatalogMeta[];
  theme:  GenreTheme;
}

export const SimilarSection: React.FC<SimilarSectionProps> = ({ items, theme: _theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { filterForKids } = useKidsFilter<CatalogMeta>();

  const displayed = React.useMemo(
    () => filterForKids(items ?? []).slice(0, 12),
    [items, filterForKids],
  );
  if (displayed.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-5">
        {t('detail.similar')}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {displayed.map(sim => {
          const posterRaw = sim.poster_path || sim.poster;
          const posterUrl = posterRaw
            ? posterRaw.startsWith('http') ? posterRaw : `${TMDB_IMAGE_BASE}w342${posterRaw.startsWith('/') ? '' : '/'}${posterRaw}`
            : null;
          const title  = sim.title || sim.name || '';
          const year   = sim.release_date ? new Date(sim.release_date).getFullYear() : sim.year;
          const type   = sim.type || sim.media_type || 'movie';
          const rating = sim.vote_average;

          return (
            <button
              key={sim.id}
              type="button"
              onClick={() => navigate(`/detail/${type}/${sim.id}`)}
              className="group text-left cursor-pointer focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg"
            >
              <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-2
                              shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-card-hover)]
                              transition-shadow duration-300">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500
                               group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center
                                  text-[var(--color-text-muted)] text-xs">
                    {t('common.noImage')}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                                transition-colors duration-300" />
                {/* Rating badge */}
                {rating != null && rating > 0 && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1
                                   px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm
                                   text-xs font-bold text-[var(--color-warning)]">
                    <Star size={10} className="fill-current" />
                    {rating.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-[var(--color-text-secondary)] text-sm font-medium truncate leading-tight">
                {title}
              </p>
              {year && (
                <p className="text-[var(--color-text-muted)] text-xs mt-0.5">{year}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
