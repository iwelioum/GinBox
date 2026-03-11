import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { EnrichedItem } from './CatalogFilters';
import { calcHoverPosition } from '@/shared/utils/hoverCardPosition';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { endpoints } from '@/shared/api/client';
import type { VideoItem, ContentType } from '@/shared/types/index';

const KIND_KEYS: Record<string, string> = {
  movie:       'kind.movie',
  tv:          'kind.series',
  anime:       'kind.anime',
  animation:   'kind.animation',
  documentary: 'kind.documentary',
  miniseries:  'kind.miniseries',
  short:       'kind.short',
  reality:     'kind.reality',
  special:     'kind.special',
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

  // Delay trailer fetch by 600ms to avoid unnecessary requests on brief hovers
  const [trailerReady, setTrailerReady] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setTrailerReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const contentType: ContentType = (item.type === 'tv' ? 'series' : item.type) as ContentType;
  const { data: videos, isError: videoError } = useQuery({
    queryKey: ['catalogMeta', contentType, String(item.id)],
    queryFn: () => endpoints.catalog.getMeta(contentType, String(item.id)).then(r => r.data),
    enabled: trailerReady,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.videos ?? [],
  });

  const trailerKey = React.useMemo(() => {
    if (!videos || videos.length === 0) return null;
    const trailer = videos.find((v: VideoItem) => v.site === 'YouTube' && v.type === 'Trailer')
      ?? videos.find((v: VideoItem) => v.site === 'YouTube');
    return trailer?.key ?? null;
  }, [videos]);

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
                 bg-[var(--color-bg-overlay)] border border-white/10
                 shadow-2xl shadow-black/80
                 animate-hovercard-in"
      style={{ top, left, transformOrigin }}
      onMouseLeave={onLeave}
    >
      {/* Video / Image backdrop 16:9 */}
      <div className="relative w-full aspect-video bg-white/5 overflow-hidden">
        {trailerKey ? (
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${trailerKey}`}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; encrypted-media"
            title={`${title} trailer`}
          />
        ) : backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center
                          text-white/10 text-4xl">
            {t('common.noImage')}
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t
                        from-[var(--color-bg-overlay)] via-transparent to-transparent" />

        {/* Floating action buttons */}
        <div className="absolute bottom-3 left-3 right-3
                        flex items-center justify-between">
          <div className="flex gap-2">
            {/* Play button */}
            <button className="flex items-center gap-1.5 px-4 py-2
                               bg-white text-black rounded-full
                               text-xs font-bold hover:bg-white/90
                               transition-colors">
              ▶ {t('common.play')}
            </button>
            {/* + List button */}
            <button className="w-8 h-8 rounded-full bg-white/20
                               border border-white/30 text-white
                               flex items-center justify-center
                               hover:bg-white/30 transition-colors
                               text-sm font-bold"
              title={t('detail.addToMyList')}
            >
              +
            </button>
          </div>
          {/* Type badge */}
          {item._kind && (
            <span className="text-xs text-white/50 bg-black/40
                             px-2 py-0.5 rounded-full ">
              {KIND_KEYS[item._kind] ? t(KIND_KEYS[item._kind]) : item._kind}
            </span>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="px-4 py-3 space-y-2">

        {/* Title */}
        <h3 className="text-sm font-semibold text-white leading-snug
                       line-clamp-1">
          {title}
        </h3>

        {/* Inline metadata */}
        <div className="flex items-center gap-2 text-[13px] text-white/50 flex-wrap">
          {rating && (
            <span className="text-yellow-400 font-semibold">⭐ {rating}</span>
          )}
          {year && <span>{year}</span>}
          {runtime && <span>{runtime}</span>}
          {item._status === 'returning' && (
            <span className="text-green-400 font-medium">🔄 {t('common.ongoing')}</span>
          )}
        </div>

        {/* Genres (3 max) */}
        {item._genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item._genres.slice(0, 3).map(g => (
              <span key={g}
                className="text-xs px-2 py-0.5 rounded-full
                           bg-white/8 text-white/50 border border-white/10">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis (2 lines max) */}
        {item.overview && (
          <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2">
            {item.overview}
          </p>
        )}

      </div>
    </div>,
    document.body
  );
};
