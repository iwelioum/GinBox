// EditorialCard.tsx — Backdrop card used in genre / editorial sections

import * as React from 'react';
import { useQuery }        from '@tanstack/react-query';
import { useTranslation }  from 'react-i18next';
import { endpoints }       from '@/shared/api/client';
import { extractLogo }     from '@/shared/utils/tmdb';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import type { PlaybackEntry } from '@/shared/types';
import type { EnrichedItem }  from '@/features/catalog/components/CatalogFilters';

interface EditorialCardProps {
  item:          EnrichedItem;
  sectionId:     string;
  showProgress:  boolean;
  onOpen:        (item: EnrichedItem) => void;
  playbackEntry?: PlaybackEntry;
}

export function EditorialCard({
  item,
  sectionId,
  showProgress,
  onOpen,
  playbackEntry,
}: EditorialCardProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = React.useState(false);
  const [loaded,  setLoaded]  = React.useState(false);

  const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
  const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';

  const { data: fanartData } = useQuery({
    queryKey:  ['fanart-editorial', sectionId, fanartType, tmdbId],
    queryFn:   () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
    enabled:   hovered && !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl = React.useMemo(() => extractLogo(fanartData), [fanartData]);

  const rawArtwork = (showProgress && playbackEntry?.stillPath)
    ? playbackEntry.stillPath
    : (item.backdrop_path || item.background || null);
  if (!rawArtwork) return null;

  const artwork = rawArtwork.startsWith('http')
    ? rawArtwork.replace('/w500/', '/w780/')
    : `${TMDB_IMAGE_BASE}w780${rawArtwork.startsWith('/') ? '' : '/'}${rawArtwork}`;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex-shrink-0 w-[260px] aspect-video rounded-xl overflow-hidden bg-white/[0.04]"
      style={{
        border:     hovered ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.10)',
        transform:  hovered ? 'scale(1.04) translateY(-4px)' : 'scale(1)',
        boxShadow:  hovered
          ? '0 22px 48px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.18)'
          : '0 4px 18px rgba(0,0,0,0.5)',
        transition: 'all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}

      <img
        src={artwork}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover"
        style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.5s ease' }}
      />

      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(4,8,20,0.65) 0%, transparent 55%)' }}
      />

      {logoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ padding: '12%', opacity: hovered ? 1 : 0.82, transition: 'opacity 0.3s ease' }}
        >
          <img
            src={logoUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.9))', maxHeight: 64 }}
          />
        </div>
      )}

      {showProgress && playbackEntry?.season != null && playbackEntry?.episode != null && (
        <div className="absolute bottom-5 left-0 right-0 px-3">
          <p className="text-[11px] font-semibold text-white/80 truncate">
            S{String(playbackEntry.season).padStart(2, '0')}E{String(playbackEntry.episode).padStart(2, '0')}
            {playbackEntry.episodeTitle ? ` — ${playbackEntry.episodeTitle}` : ''}
          </p>
        </div>
      )}

      {showProgress && item._userProgress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-cyan-400"
            style={{ width: `${Math.min(100, Math.max(0, item._userProgress))}%` }}
          />
        </div>
      )}
    </button>
  );
}
