// HeroSlideContent.tsx -- Badge, logo / title, metadata, synopsis, and
// action buttons rendered inside the hero content overlay.

import * as React        from 'react';
import { useNavigate }   from 'react-router-dom';
import { motion }        from 'framer-motion';
import { Play, Info }    from 'lucide-react';
import type { CatalogMeta } from '@/shared/types';
import {
  getYear, getGenres, formatDuration, computeBadge, useRipple,
} from './heroBannerUtils';

export interface HeroSlideContentProps {
  item:     CatalogMeta;
  heroLogo: string | null;
}

export const HeroSlideContent: React.FC<HeroSlideContentProps> = ({ item, heroLogo }) => {
  const navigate = useNavigate();
  const { ripples, addRipple } = useRipple();

  const title     = item.title ?? item.name ?? '';
  const synopsis  = item.overview ?? item.description ?? '';
  const year      = getYear(item);
  const rating    = item.vote_average ?? item.imdbRating;
  const genres    = getGenres(item);
  const duration  = formatDuration(item);
  const badge     = computeBadge(item);
  const mediaType = item.media_type ?? item.type ?? 'movie';

  return (
    <>
      {badge && (
        <motion.div
          className="mb-3"
          animate={{ opacity: [0.72, 1, 0.72] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className={[
            'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-[20px]',
            'text-[10px] font-extrabold tracking-[0.07em] uppercase text-white',
            badge === 'new'
              ? 'bg-[rgba(0,99,229,0.82)] border border-[rgba(100,160,255,0.35)]'
              : 'bg-[rgba(220,80,0,0.82)] border border-[rgba(255,130,50,0.35)]',
          ].join(' ')}>
            {badge === 'new' ? '★ New' : '🔥 Trending'}
          </span>
        </motion.div>
      )}

      {heroLogo ? (
        <img
          src={heroLogo} alt={title} loading="lazy"
          className="block max-h-24 max-w-[420px] object-contain mb-[18px]
                     drop-shadow-[0_4px_28px_rgba(0,0,0,0.95)]"
        />
      ) : (
        <h1 className="text-[clamp(1.9rem,3.8vw,3.4rem)] font-black tracking-[-0.035em]
                       leading-[1.06] mb-4 text-[var(--color-text-primary)]
                       [text-shadow:0_2px_24px_rgba(0,0,0,0.95)]">
          {title}
        </h1>
      )}

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {year && (
          <span className="text-[12.5px] text-white/[0.55] font-medium">{year}</span>
        )}
        {rating != null && rating > 0 && (
          <>
            <span className="text-[var(--color-border-strong)] text-[11px]">•</span>
            <span className="text-[12.5px] text-green-400 font-bold">{Math.round(rating * 10)}%</span>
          </>
        )}
        {duration && (
          <>
            <span className="text-[var(--color-border-strong)] text-[11px]">•</span>
            <span className="text-[12.5px] text-white/[0.55] font-medium">{duration}</span>
          </>
        )}
        {genres.slice(0, 3).map(g => (
          <span key={g} className="text-[10.5px] px-2 py-0.5 rounded-[5px] font-medium
                                   border border-white/[0.13] bg-black/[0.38] text-white/[0.62]">
            {g}
          </span>
        ))}
      </div>

      {synopsis && (
        <p className="text-sm text-white/80 leading-[1.65] mb-6 max-w-[500px] line-clamp-3">
          {synopsis}
        </p>
      )}

      <div className="flex items-center gap-3">
        <motion.button
          onClick={(e) => { addRipple(e); navigate(`/detail/${mediaType}/${item.id}`); }}
          whileHover={{ boxShadow: '0 0 28px rgba(255,255,255,0.26)', scale: 1.025 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="relative overflow-hidden flex items-center gap-2 px-[26px] py-[11px]
                     rounded-[var(--radius-card)] bg-white text-black text-sm font-bold
                     border-none cursor-pointer tracking-[-0.01em] select-none"
        >
          {ripples.map(r => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.40 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute rounded-full w-16 h-16 bg-black/[0.18] pointer-events-none"
              style={{ left: r.x - 32, top: r.y - 32 }}
            />
          ))}
          <Play size={15} fill="currentColor" strokeWidth={0} />
          Watch
        </motion.button>

        <motion.button
          onClick={() => navigate(`/detail/${mediaType}/${item.id}`)}
          whileHover={{ scale: 1.025, background: 'rgba(255,255,255,0.10)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="flex items-center gap-2 px-[22px] py-[11px] rounded-[var(--radius-card)]
                     text-[var(--color-text-primary)] text-sm font-semibold cursor-pointer
                     tracking-[-0.01em] backdrop-blur-[8px] select-none
                     border border-[var(--color-white-30)]"
          style={{ background: 'rgba(0,0,0,0.38)' }}
        >
          <Info size={15} />
          More info
        </motion.button>
      </div>
    </>
  );
};
