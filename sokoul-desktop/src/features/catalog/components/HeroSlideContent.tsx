// HeroSlideContent.tsx — Premium title, metadata, synopsis, and action buttons

import * as React        from 'react';
import { useNavigate }   from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      {/* ── Premium badge indicator ──────────────────────────────────── */}
      {badge && (
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-3"
        >
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white border ${
            badge === 'new' 
              ? 'bg-[--color-accent]/80 border-[--color-accent]/35' 
              : 'bg-red-600/80 border-red-400/35'
          }`}>
            {badge === 'new' ? '✦ Nouveau' : '▲ Tendance'}
          </span>
        </motion.div>
      )}

      {/* ── Title or logo ─────────────────────────────────────────── */}
      {heroLogo ? (
        <img
          src={heroLogo} 
          alt={title} 
          loading="lazy"
          className="max-h-24 max-w-lg object-contain mb-4 drop-shadow-2xl"
        />
      ) : (
        <h1 className="text-[--text-hero] font-black tracking-[-0.035em] leading-tight mb-4 text-[--color-text-primary] drop-shadow-2xl">
          {title}
        </h1>
      )}

      {/* ── Metadata row ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap text-sm text-[--color-text-secondary]">
        {year && <span className="font-medium">{year}</span>}
        {rating != null && rating > 0 && (
          <>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">⭐</span>
              <span className="text-green-400 font-bold">{Math.round(rating * 10)}%</span>
            </div>
          </>
        )}
        {duration && (
          <>
            <span className="text-white/20">·</span>
            <span className="font-medium">{duration}</span>
          </>
        )}
        {genres.slice(0, 2).map(g => (
          <span key={g} className="px-2 py-1 rounded border border-white/15 bg-black/40 text-xs font-medium">
            {g}
          </span>
        ))}
      </div>

      {/* ── Synopsis with line clamping ──────────────────────────── */}
      {synopsis && (
        <p className="text-base text-[--color-text-primary] leading-relaxed mb-6 max-w-xl line-clamp-2">
          {synopsis}
        </p>
      )}

      {/* ── Action buttons row ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Primary watch button */}
        <motion.button
          onClick={(e) => { addRipple(e); navigate(`/detail/${mediaType}/${item.id}`); }}
          whileHover={{ scale: 1.025, boxShadow: '0 0 28px rgba(108, 99, 255, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-lg bg-[--color-accent] text-white font-bold text-sm tracking-[-0.01em] border-none cursor-pointer select-none hover:bg-[--color-accent-hover] transition-colors"
        >
          {ripples.map(r => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute rounded-full w-16 h-16 bg-white/20 pointer-events-none"
              style={{ left: r.x - 32, top: r.y - 32 }}
            />
          ))}
          <Play size={16} fill="white" strokeWidth={0} />
          {t('hero.play', 'Lire')}
        </motion.button>

        {/* Secondary info button */}
        <motion.button
          onClick={() => navigate(`/detail/${mediaType}/${item.id}`)}
          whileHover={{ scale: 1.025, backgroundColor: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black/40 text-[--color-text-primary] font-semibold text-sm tracking-[-0.01em] border border-white/25 cursor-pointer select-none backdrop-blur-sm hover:border-white/40 transition-all"
        >
          <Info size={16} />
          {t('hero.moreInfo', 'Détails')}
        </motion.button>
      </div>
    </>
  );
};
