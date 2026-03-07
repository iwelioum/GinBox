// components/detail/SagaSection.tsx — Step 11
// Films from a TMDB collection
// Current film highlighted with colored ring

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

interface CollectionPart {
  id:           number;
  title:        string;
  release_date?: string;
  poster_path?: string;
}

interface Collection {
  id:       number;
  name:     string;
  parts?:   CollectionPart[];
}

interface SagaSectionProps {
  collection: unknown;
  currentId:  number;
}

export const SagaSection: React.FC<SagaSectionProps> = ({ collection, currentId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const col = collection as Collection | null;

  if (!col?.parts || col.parts.length === 0) return null;

  return (
    <section className="mb-[40px]">
      <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
        {t('detail.sagaPrefix', { name: col.name })}
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {col.parts.map(part => {
          const isCurrent = part.id === currentId;
          const posterUrl = part.poster_path
            ? `${TMDB_IMAGE_BASE}w185${part.poster_path}`
            : null;
          const year = part.release_date ? new Date(part.release_date).getFullYear() : null;

          return (
            <button
              key={part.id}
              type="button"
              onClick={() => !isCurrent && navigate(`/detail/movie/${part.id}`)}
              className="flex-shrink-0 flex flex-col items-center gap-2 w-[90px] group cursor-pointer"
            >
              <div
                className="w-[90px] h-[135px] rounded-lg overflow-hidden relative"
                style={{
                  outline: isCurrent ? '2px solid var(--accent, #0072D2)' : '2px solid transparent',
                  outlineOffset: '2px',
                  boxShadow: isCurrent ? '0 0 16px rgba(var(--accent-rgb,0,114,210),0.4)' : 'none',
                  transition: 'box-shadow 0.3s',
                }}
              >
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={part.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20 text-[10px]">
                    ?
                  </div>
                )}

                {/* Current film badge */}
                {isCurrent && (
                  <div
                    className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--accent, #0072D2)' }}
                  >
                    {t('detail.here')}
                  </div>
                )}
              </div>
              <p className="text-white/70 text-[10px] text-center leading-tight line-clamp-2 w-full">
                {part.title}
              </p>
              {year && <p className="text-white/35 text-[9px]">{year}</p>}
            </button>
          );
        })}
      </div>
    </section>
  );
};
