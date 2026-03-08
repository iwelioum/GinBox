// ContentCard.tsx - Clean image-only card (no title, no logo overlay)

import * as React from 'react';
import { Link }        from 'react-router-dom';
import type { CatalogMeta } from '@/shared/types';
import { getTopPosterUrl }  from '@/shared/utils/topPosters';
import { TMDB_IMAGE_BASE }  from '@/shared/constants/tmdb';

function imgUrl(path: string | undefined | null, size = 'w780'): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path.replace('/w500/', `/${size}/`);
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface ContentCardProps {
  item:       CatalogMeta;
  variant:    'landscape' | 'poster';
  className?: string;
  onHoverEnter?: (id: string | number, rect: DOMRect) => void;
  onHoverLeave?: () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  item, variant, className, onHoverEnter, onHoverLeave,
}) => {
  const [hovered, setHovered] = React.useState(false);

  const mediaType  = item.media_type ?? item.type ?? 'movie';
  const backdrop   = imgUrl(item.backdrop_path ?? item.background, 'w780');
  const poster     = imgUrl(item.poster_path ?? item.poster, 'w500');
  const topPoster  = getTopPosterUrl(item);

  const detailPath = `/detail/${mediaType}/${item.id}`;
  const title      = item.title ?? item.name ?? '';

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
      </Link>
    </div>
  );
};

export { ContentCard };