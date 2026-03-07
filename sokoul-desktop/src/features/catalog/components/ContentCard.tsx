// ContentCard.tsx — Exact replica of CategoryCard.js from Disney+ clone
//
// Fixed 280×157px · border-radius 8px · border 2px rgba(249,249,249,0.08)
// Hover: scale(1.05), border-color rgba(249,249,249,0.5), box-shadow
// Backdrop image + overlay gradient + fanart logo bottom center

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
  const [hovered, setHovered] = React.useState(false);

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

  return (
    <div
      className={className ?? ''}
      style={{
        flex: isPoster ? '0 0 200px' : '0 0 280px',
        height: isPoster ? 300 : 157,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        border: '2px solid rgba(249,249,249,0.08)',
        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        ...(hovered ? {
          transform: 'scale(1.05)',
          borderColor: 'rgba(249,249,249,0.5)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
          zIndex: 2,
        } : {}),
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        onHoverEnter?.(item.id, e.currentTarget.getBoundingClientRect());
      }}
      onMouseLeave={() => { setHovered(false); onHoverLeave?.(); }}
    >
      <Link
        to={detailPath}
        style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
      >
        {/* Backdrop */}
        <img
          src={src}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'absolute',
            inset: 0,
          }}
          loading="lazy"
          draggable={false}
        />
        {/* Overlay gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(4,7,20,0.55) 0%, rgba(4,7,20,0.1) 40%, transparent 100%)',
          }}
        />
        {/* Logo (fanart) — mandatory identifier; title text only when no logo */}
        {logoUrl !== null ? (
          <img
            src={logoUrl}
            alt={title}
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '62%',
              maxHeight: 52,
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.95))',
              zIndex: 2,
            }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 0,
              right: 0,
              textAlign: 'center',
              padding: '0 12px',
              zIndex: 2,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: isPoster ? 13 : 12,
                fontWeight: 700,
                textShadow: '0 2px 10px rgba(0,0,0,0.95)',
                letterSpacing: '0.03em',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
};

export { ContentCard };
