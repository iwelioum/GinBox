// ContentCard.tsx — Premium Netflix 2025 × Infuse × Apple TV redesign
//
// Aspect-driven responsive design · Clean poster default · Rich hover reveals
// Poster: aspect-[2/3] · Landscape: aspect-video · Tailwind + CSS variables only

import * as React from 'react';
import { Link }        from 'react-router-dom';
import { useQuery }    from '@tanstack/react-query';
import type { CatalogMeta } from '@/shared/types';
import { endpoints }   from '@/shared/api/client';
import { getLogo, type FanartResponse } from '@/shared/utils/fanart';
import { getTopPosterUrl }              from '@/shared/utils/topPosters';
import { TMDB_IMAGE_BASE }             from '@/shared/constants/tmdb';

function imgUrl(path: string | undefined | null, size = 'w780'): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path.replace('/w500/', `/${size}/`);
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentCardProps {
  item:       CatalogMeta;
  variant:    'landscape' | 'poster';
  className?: string;
  onHoverEnter?: (id: string | number, rect: DOMRect) => void;
  onHoverLeave?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ContentCard: React.FC<ContentCardProps> = ({
  item, variant, className, onHoverEnter, onHoverLeave,
}) => {
  const mediaType  = item.media_type ?? item.type ?? 'movie';
  const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
  // 'tv' and 'series' both map to the TV fanart endpoint
  const fanartType = (mediaType === 'series' || mediaType === 'tv') ? 'tv' : 'movie' as 'movie' | 'tv';

  // Fanart logo — load immediately; errors silently return null (no logo shown)
  const { data: fanartData } = useQuery<FanartResponse | null>({
    queryKey:  ['fanart-card', fanartType, tmdbId],
    queryFn:   async () => {
      try { return (await endpoints.fanart.get(fanartType, tmdbId)).data as FanartResponse; }
      catch { return null; }
    },
    enabled:   !!tmdbId,
    staleTime: Infinity,
  });

  const logoUrl   = fanartData != null ? getLogo(fanartData, fanartType) : null;
  const backdrop  = imgUrl(item.backdrop_path ?? item.background, 'w780');
  const poster    = imgUrl(item.poster_path ?? item.poster, 'w500');
  const topPoster = getTopPosterUrl(item);

  const detailPath = `/detail/${mediaType}/${item.id}`;
  const title      = item.title ?? item.name ?? '';

  // Poster variant: Top Posters first (fallback_url baked in), then TMDB poster, then backdrop
  // Landscape variant: backdrop first, Top Posters as fallback when backdrop missing
  const isPoster = variant === 'poster';
  const src      = isPoster ? (topPoster ?? poster ?? backdrop) : (backdrop ?? topPoster);
  if (!src) return null;

  // Format rating for display
  const rating = item.vote_average;
  const formattedRating = rating && rating > 0 ? rating.toFixed(1) : null;

  return (
    <div
      className={`group relative overflow-hidden rounded-card cursor-pointer transition-all duration-200 
        hover:scale-[1.04] hover:shadow-card-hover ${variant === 'poster' ? 'aspect-[2/3]' : 'aspect-video'} 
        ${className ?? ''}`}
      onMouseEnter={(e) => {
        onHoverEnter?.(item.id, e.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={() => { onHoverLeave?.(); }}
    >
      <Link to={detailPath} className="block w-full h-full relative">
        {/* Main poster image */}
        <img
          src={src}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
        
        {/* Hover overlay gradient - only visible on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Rating badge - top-right, revealed on hover */}
        {formattedRating && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
            bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
            ⭐ {formattedRating}
          </div>
        )}
        
        {/* Heart icon - top-right below rating, revealed on hover */}
        <div className="absolute top-2 right-2 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        
        {/* Title - bottom, revealed on hover when no fanart logo */}
        {!logoUrl && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 
            transition-opacity duration-200">
            <h3 className="text-sm font-semibold text-white line-clamp-1 drop-shadow-lg">
              {title}
            </h3>
          </div>
        )}
        
        {/* Logo (fanart) - always visible when available, centered bottom */}
        {logoUrl && (
          <img
            src={logoUrl}
            alt={title}
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2 max-w-[62%] max-h-12 object-contain
              filter drop-shadow-lg z-10"
            loading="lazy"
          />
        )}
      </Link>
    </div>
  );
};

export { ContentCard };
