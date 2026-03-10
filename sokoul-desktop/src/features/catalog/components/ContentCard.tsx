// ContentCard.tsx — Image card with logo overlay + styled text fallback

import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CatalogMeta } from '@/shared/types';
import { getTopPosterUrl } from '@/shared/utils/topPosters';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import { useContentCardData } from '../hooks/useContentCardData';

// -- Types --------------------------------------------------------------------

interface ContentCardProps {
  item: CatalogMeta;
  variant: 'landscape' | 'poster';
  className?: string;
  onHoverEnter?: (id: string | number, rect: DOMRect) => void;
  onHoverLeave?: () => void;
}

// -- Constants ----------------------------------------------------------------

const HOVER_TRANSITION = {
  duration: 0.25,
  ease: [0.25, 0.46, 0.45, 0.94],
} as const;

// -- Component ----------------------------------------------------------------

const ContentCardInner: React.FC<ContentCardProps> = ({
  item,
  variant,
  className,
  onHoverEnter,
  onHoverLeave,
}) => {
  const { identity, type, id } = useContentCardData(item);

  const backdrop = buildTmdbImageUrl(item.backdrop_path ?? item.background, 'w780');
  const poster   = buildTmdbImageUrl(item.poster_path  ?? item.poster,       'w500');
  const topPoster = getTopPosterUrl(item);
  const title   = item.title ?? item.name ?? '';
  const isPoster = variant === 'poster';

  // Each source is tagged as textless or not so we know whether to overlay the logo.
  // TopPoster and backdrop images are textless; standard TMDB posters have baked-in title text.
  const srcs = React.useMemo<{ url: string; textless: boolean }[]>(() => {
    const chain: { url: string | null; textless: boolean }[] = isPoster
      ? [
          { url: topPoster, textless: true  },
          { url: poster,    textless: false },
          { url: backdrop,  textless: true  },
        ]
      : [
          { url: backdrop,   textless: true  },
          { url: topPoster,  textless: true  },
          { url: poster,     textless: false },
        ];
    return chain.filter((s): s is { url: string; textless: boolean } => Boolean(s.url));
  }, [isPoster, topPoster, poster, backdrop]);

  const [srcIdx,      setSrcIdx]      = React.useState(0);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Reset when item changes
  React.useEffect(() => { setSrcIdx(0); setImageLoaded(false); }, [item.id]);

  const current = srcs[srcIdx] ?? null;
  const src = current?.url ?? null;
  const showOverlay = current?.textless ?? false;

  if (!src) return null;

  return (
    <motion.div
      className={[
        'relative overflow-hidden cursor-pointer shrink-0 grow-0',
        'border-2 border-white/[0.08] rounded-[var(--radius-card)]',
        'hover:border-white/50 hover:shadow-[var(--shadow-card-hover)] hover:z-[2]',
        'transition-[border-color,box-shadow] duration-[250ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
        isPoster ? 'w-[200px] aspect-[2/3]' : 'w-[280px] aspect-video',
        className,
      ].filter(Boolean).join(' ')}
      whileHover={{ scale: 1.05 }}
      transition={HOVER_TRANSITION}
      onMouseEnter={(e) =>
        onHoverEnter?.(item.id, e.currentTarget.getBoundingClientRect())
      }
      onMouseLeave={onHoverLeave}
    >
      <Link to={`/detail/${type}/${id}`} className="block w-full h-full relative">
        {/* Skeleton placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[var(--color-bg-elevated)] animate-pulse" />
        )}

        {/* Main artwork */}
        <img
          src={src}
          alt={title}
          className={[
            'absolute inset-0 w-full h-full object-cover',
            'transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          loading="lazy"
          draggable={false}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (srcIdx < srcs.length - 1) setSrcIdx(i => i + 1);
            else setImageLoaded(true); // all sources exhausted — skeleton stays as placeholder
          }}
        />

        {/* Bottom gradient — only when overlaying logo/text on textless image */}
        {showOverlay && (
          <div
            className={[
              'absolute bottom-0 inset-x-0 pointer-events-none',
              'bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.3)_55%,transparent_100%)]',
              isPoster ? 'h-[55%]' : 'h-[65%]',
            ].join(' ')}
          />
        )}

        {/* Logo image or styled text — only on textless sources to avoid double-title */}
        {showOverlay && (identity.kind === 'logo' ? (
          <img
            src={identity.url}
            alt={`${title} logo`}
            className={[
              'absolute left-1/2 -translate-x-1/2 max-w-[82%] object-contain pointer-events-none',
              '[filter:drop-shadow(0_1px_5px_rgba(0,0,0,0.95))_drop-shadow(0_0_2px_rgba(0,0,0,0.8))]',
              isPoster ? 'bottom-3.5 max-h-[52px]' : 'bottom-[9px] max-h-[38px]',
            ].join(' ')}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <span
            className={[
              'absolute left-3 right-3 text-center leading-tight pointer-events-none',
              'line-clamp-2 [word-break:break-word]',
              isPoster ? 'bottom-3.5' : 'bottom-[9px]',
            ].join(' ')}
            style={{
              fontFamily: identity.style.fontFamily,
              fontSize: isPoster ? 'clamp(0.8rem, 1.8vw, 1.1rem)' : identity.style.fontSize,
              fontWeight: identity.style.fontWeight,
              letterSpacing: identity.style.letterSpacing,
              textTransform: identity.style.textTransform,
              fontStyle: identity.style.fontStyle,
              color: identity.style.color,
              textShadow: identity.style.textShadow,
            }}
          >
            {identity.title}
          </span>
        ))}
      </Link>
    </motion.div>
  );
};

const ContentCard = React.memo(ContentCardInner);

export { ContentCard };
