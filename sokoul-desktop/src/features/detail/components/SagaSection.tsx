// components/detail/SagaSection.tsx — Collection/franchise timeline
// Poster cards with current film highlighting · Number badges · Collection overview

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
  overview?: string;
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

  const sorted = [...col.parts].sort((a, b) => {
    const da = a.release_date ? new Date(a.release_date).getTime() : 0;
    const db = b.release_date ? new Date(b.release_date).getTime() : 0;
    return da - db;
  });

  return (
    <section>
      <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
        {t('detail.sagaPrefix', { name: col.name })}
      </h2>
      {col.overview && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5 max-w-2xl line-clamp-2">
          {col.overview}
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth
                      scrollbar-thin scrollbar-thumb-[var(--color-white-8)] scrollbar-track-transparent">
        {sorted.map((part, idx) => {
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
              disabled={isCurrent}
              className={`flex-shrink-0 flex flex-col items-center gap-2 w-24 group cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--color-accent)] rounded-lg
                         transition-opacity duration-200
                         ${isCurrent ? 'cursor-default' : 'hover:opacity-90'}`}
            >
              <div className={`relative w-24 h-36 rounded-lg overflow-hidden
                              transition-shadow duration-300
                              ${isCurrent
                                ? 'ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-base)] shadow-[0_0_16px_rgba(108,99,255,0.3)]'
                                : 'shadow-[var(--shadow-card)] group-hover:shadow-[var(--shadow-card-hover)]'
                              }`}>
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={part.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500
                               group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center
                                  text-[var(--color-text-muted)] text-xs">
                    ?
                  </div>
                )}

                {/* Number badge */}
                <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                 ${isCurrent
                                   ? 'bg-[var(--color-accent)] text-white'
                                   : 'bg-black/60 text-[var(--color-text-secondary)]'}`}>
                  {idx + 1}
                </span>
              </div>
              <p className={`text-xs text-center leading-tight line-clamp-2 w-full
                            ${isCurrent ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
                {part.title}
              </p>
              {year && (
                <p className="text-[var(--color-text-muted)] text-[11px] -mt-1">{year}</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
