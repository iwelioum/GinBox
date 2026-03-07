// HeroSlide.tsx — Background (Ken Burns + gradients), progress bar,
// and animated content overlay for one hero slide.

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CatalogMeta }       from '@/shared/types';
import {
  AUTOPLAY_MS, imgUrl, bgVariants, contentVariants,
} from './heroBannerUtils';
import { HeroSlideContent } from './HeroSlideContent';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HeroSlideProps {
  item:         CatalogMeta;
  safeIdx:      number;
  direction:    number;
  paused:       boolean;
  dominantTint: string;
  heroLogo:     string | null;
  slideCount:   number;
}

// ── Component ────────────────────────────────────────────────────────────────

export const HeroSlide: React.FC<HeroSlideProps> = ({
  item, safeIdx, direction, paused, dominantTint, heroLogo, slideCount,
}) => {
  const bgImg = imgUrl(item.backdrop_path ?? item.background, 'original')
             ?? imgUrl(item.poster_path ?? item.poster, 'w1280');

  return (
    <>
      {/* ── Background crossfade + Ken Burns ─────────────────────────────── */}
      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={`bg-${safeIdx}`}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.4, ease: 'easeInOut' },
            x:       { duration: 0.4, ease: 'easeOut' },
            scale:   { duration: 0.4, ease: 'easeOut' },
          }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {bgImg ? (
            <motion.img
              key={`img-${safeIdx}`}
              src={bgImg}
              alt=""
              initial={{ scale: 1.0 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 20%', display: 'block',
              }}
              draggable={false}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)',
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to right, ${dominantTint} 16%, rgba(4,7,20,0.68) 50%, rgba(4,7,20,0.14) 78%, transparent 100%)`,
            transition: 'background 1.5s ease',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(4,7,20,1) 0%, rgba(4,7,20,0.60) 20%, rgba(4,7,20,0.10) 48%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(4,7,20,0.38) 0%, transparent 18%)',
          }} />
        </motion.div>
      </AnimatePresence>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      {!paused && slideCount > 1 && (
        <motion.div
          key={`progress-${safeIdx}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: 'rgba(255,255,255,0.52)', transformOrigin: 'left', zIndex: 20,
          }}
        />
      )}

      {/* ── Content panel ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end',
        paddingBottom: 60, paddingLeft: 'calc(3.5vw + 5px)', paddingRight: 'calc(3.5vw + 5px)',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${safeIdx}`}
            variants={contentVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ maxWidth: 580 }}
          >
            <HeroSlideContent item={item} heroLogo={heroLogo} />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
