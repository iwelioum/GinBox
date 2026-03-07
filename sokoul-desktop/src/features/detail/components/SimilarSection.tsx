// components/detail/SimilarSection.tsx — Step 13
// Horizontal scroll of similar cards

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';

interface SimilarSectionProps {
  items?: CatalogMeta[];
  theme:  GenreTheme;
}

export const SimilarSection: React.FC<SimilarSectionProps> = ({ items, theme: _theme }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayed = items?.slice(0, 8) ?? [];
  if (displayed.length === 0) return null;

  return (
    <section className="mb-[40px]">
      <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
        {t('detail.similar')}
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {displayed.map(sim => {
          const imgRaw = sim.backdrop_path || sim.background || sim.poster_path || sim.poster;
          const imgUrl = imgRaw
            ? imgRaw.startsWith('http') ? imgRaw : `${TMDB_IMAGE_BASE}w500${imgRaw.startsWith('/') ? '' : '/'}${imgRaw}`
            : null;
          const title  = sim.title || sim.name || '';
          const year   = sim.release_date ? new Date(sim.release_date).getFullYear() : sim.year;
          const type   = sim.type || sim.media_type || 'movie';

          return (
            <button
              key={sim.id}
              type="button"
              onClick={() => navigate(`/detail/${type}/${sim.id}`)}
              className="flex-shrink-0 w-[200px] group text-left cursor-pointer"
            >
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-2">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20 text-xs">
                    {t('common.noImage')}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
              <p className="text-white/80 text-[13px] font-medium truncate leading-tight">{title}</p>
              {year && <p className="text-white/40 text-[11px]">{year}</p>}
            </button>
          );
        })}
      </div>
    </section>
  );
};
