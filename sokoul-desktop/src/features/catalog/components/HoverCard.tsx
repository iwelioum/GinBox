import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { EnrichedItem } from './CatalogFilters';
import { calcHoverPosition } from '@/shared/utils/hoverCardPosition';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';

const KIND_LABELS: Record<string, string> = {
  movie:       'Movie',
  tv:          'Series',
  anime:       'Anime',
  animation:   'Animation',
  documentary: 'Documentary',
  miniseries:  'Mini-series',
  short:       'Short film',
  reality:     'Reality TV',
  special:     'Special',
};

interface HoverCardProps {
  item:       EnrichedItem;
  anchorRect: DOMRect;
  onLeave:    () => void;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  item, anchorRect, onLeave,
}) => {
  const { t } = useTranslation();
  const { top, left, transformOrigin } = calcHoverPosition(anchorRect);

  const backdropUrl = item.backdrop_path
    ? `${TMDB_IMAGE_BASE}w500${item.backdrop_path}`
    : item.poster_path
      ? `${TMDB_IMAGE_BASE}w342${item.poster_path}`
      : null;

  const title    = item.title ?? item.name ?? '';
  const year     = item._year ?? '';
  const rating   = item._rating ? item._rating.toFixed(1) : null;
  const runtime  = item._movieRuntime
    ? `${Math.floor(item._movieRuntime / 60)}h${item._movieRuntime % 60 > 0 ? `${item._movieRuntime % 60}m` : ''}`
    : item._seasonCount
      ? t('common.seasonCount', { count: item._seasonCount })
      : null;

  return ReactDOM.createPortal(
    <div
      className="fixed z-[1000] w-[320px] rounded-xl overflow-hidden
                 bg-[var(--color-bg-overlay)] border border-[var(--color-border)]
                 backdrop-blur-xl
                 animate-hovercard-in"
      style={{ 
        top, left, transformOrigin,
        boxShadow: 'var(--shadow-overlay)'
      }}
      onMouseLeave={onLeave}
    >
      {/* Backdrop image section */}
      <div className="relative w-full aspect-video overflow-hidden rounded-t-xl">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center
                          bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-4xl">
            🎬
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t
                        from-[var(--color-bg-overlay)] to-transparent" />

        {/* Action buttons on backdrop */}
        <div className="absolute bottom-3 left-3 right-3
                        flex items-center justify-between">
          <div className="flex gap-2">
            {/* Play button */}
            <button className="flex items-center gap-1.5 px-4 py-2
                               bg-[var(--color-accent)] text-white rounded-full
                               text-xs font-bold hover:bg-[var(--color-accent-hover)]
                               transition-[var(--transition-fast)]">
              ▶ Lire
            </button>
            {/* Watchlist button */}
            <button className="w-8 h-8 rounded-full bg-white/20
                               border border-white/30 text-white
                               flex items-center justify-center
                               hover:bg-white/30 transition-[var(--transition-fast)]
                               text-sm font-bold"
              title={t('detail.addToMyList')}>
              +
            </button>
          </div>
          {/* Type badge */}
          {item._kind && (
            <span className="text-[10px] text-[var(--color-text-muted)] bg-black/40
                             px-2 py-0.5 rounded-full">
              {KIND_LABELS[item._kind] ?? item._kind}
            </span>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-[1rem] font-semibold text-[var(--color-text-primary)]
                       line-clamp-1 mb-2">
          {title}
        </h3>

        {/* Metadata row */}
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] mb-3">
          {rating && (
            <>
              <span className="text-amber-400 font-semibold">★ {rating}</span>
              <span>·</span>
            </>
          )}
          {year && (
            <>
              <span>{year}</span>
              {runtime && <span>·</span>}
            </>
          )}
          {runtime && <span>{runtime}</span>}
        </div>

        {/* Genre pills */}
        {item._genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item._genres.slice(0, 3).map(g => (
              <span key={g}
                className="text-[10px] px-2 py-0.5 rounded-full
                           bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]
                           border border-[var(--color-border)]">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis */}
        {item.overview && (
          <p className="text-[0.875rem] text-[var(--color-text-secondary)]
                        line-clamp-3 leading-relaxed">
            {item.overview}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};
