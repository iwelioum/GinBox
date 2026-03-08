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
          animate={{ opacity: [0.72, 1, 0.72] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 12 }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20, fontSize: 10,
            fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' as const,
            background: badge === 'new' ? 'rgba(0,99,229,0.82)' : 'rgba(220,80,0,0.82)',
            color: '#fff',
            border: `1px solid ${badge === 'new' ? 'rgba(100,160,255,0.35)' : 'rgba(255,130,50,0.35)'}`,
          }}>
            {badge === 'new' ? '★ New' : '🔥 Trending'}
          </span>
        </motion.div>
      )}

      {heroLogo ? (
        <img
          src={heroLogo} alt={title} loading="lazy"
          style={{
            maxHeight: 96, maxWidth: 420, objectFit: 'contain',
            marginBottom: 18, filter: 'drop-shadow(0 4px 28px rgba(0,0,0,0.95))', display: 'block',
          }}
        />
      ) : (
        <h1 style={{
          fontSize: 'clamp(1.9rem, 3.8vw, 3.4rem)', fontWeight: 900,
          letterSpacing: '-0.035em', lineHeight: 1.06, marginBottom: 16,
          color: '#f9f9f9', textShadow: '0 2px 24px rgba(0,0,0,0.95)',
        }}>
          {title}
        </h1>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {year && (
          <span style={{ fontSize: 12.5, color: 'rgba(249,249,249,0.55)', fontWeight: 500 }}>{year}</span>
        )}
        {rating != null && rating > 0 && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 11 }}>•</span>
            <span style={{ fontSize: 12.5, color: '#4ade80', fontWeight: 700 }}>{Math.round(rating * 10)}%</span>
          </>
        )}
        {duration && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 11 }}>•</span>
            <span style={{ fontSize: 12.5, color: 'rgba(249,249,249,0.55)', fontWeight: 500 }}>{duration}</span>
          </>
        )}
        {genres.slice(0, 3).map(g => (
          <span key={g} style={{
            fontSize: 10.5, padding: '2px 8px', borderRadius: 5,
            border: '1px solid rgba(255,255,255,0.13)', background: 'rgba(0,0,0,0.38)',
            color: 'rgba(249,249,249,0.62)', fontWeight: 500,
          }}>
            {g}
          </span>
        ))}
      </div>

      {synopsis && (
        <p style={{
          fontSize: 14, color: 'rgba(249,249,249,0.80)', lineHeight: 1.65,
          marginBottom: 24, maxWidth: 500, display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } as React.CSSProperties}>
          {synopsis}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.button
          onClick={(e) => { addRipple(e); navigate(`/detail/${mediaType}/${item.id}`); }}
          whileHover={{ boxShadow: '0 0 28px rgba(255,255,255,0.26)', scale: 1.025 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          style={{
            position: 'relative', overflow: 'hidden', display: 'flex',
            alignItems: 'center', gap: 8, padding: '11px 26px', borderRadius: 8,
            background: '#f9f9f9', color: '#040714', fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer', letterSpacing: '-0.01em', userSelect: 'none',
          }}
        >
          {ripples.map(r => (
            <motion.span
              key={r.id}
              initial={{ scale: 0, opacity: 0.40 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              style={{
                position: 'absolute', borderRadius: '50%', width: 64, height: 64,
                background: 'rgba(4,7,20,0.18)', left: r.x - 32, top: r.y - 32,
                pointerEvents: 'none',
              }}
            />
          ))}
          <Play size={15} fill="#040714" strokeWidth={0} />
          Watch
        </motion.button>

        <motion.button
          onClick={() => navigate(`/detail/${mediaType}/${item.id}`)}
          whileHover={{ scale: 1.025, background: 'rgba(255,255,255,0.10)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
            borderRadius: 8, background: 'rgba(0,0,0,0.38)', color: '#f9f9f9',
            fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.25)',
            cursor: 'pointer', letterSpacing: '-0.01em', backdropFilter: 'blur(8px)',
            userSelect: 'none',
          }}
        >
          <Info size={15} />
          More info
        </motion.button>
      </div>
    </>
  );
};
