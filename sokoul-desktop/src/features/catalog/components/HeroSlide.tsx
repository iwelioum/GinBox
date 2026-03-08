// HeroSlide.tsx — Premium background with gradient overlay and animated content

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
      {/* ── Full-width backdrop with premium gradient overlay ───────────── */}
      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={`bg-${safeIdx}`}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.6, ease: 'easeInOut' },
            x:       { duration: 0.6, ease: 'easeOut' },
            scale:   { duration: 0.6, ease: 'easeOut' },
          }}
          className="absolute inset-0"
        >
          {bgImg ? (
            <motion.img
              key={`img-${safeIdx}`}
              src={bgImg}
              alt=""
              initial={{ scale: 1.0 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              className="w-full h-full object-cover object-[center_20%] block"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[--color-bg-base] to-[--color-bg-elevated]" />
          )}
          
          {/* Netflix 2025 style gradient overlay: bottom to top fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[--color-bg-base] via-transparent to-transparent transition-all duration-[--transition-slow]" />
        </motion.div>
      </AnimatePresence>

      {/* ── Auto-slide progress bar ──────────────────────────────────── */}
      {!paused && slideCount > 1 && (
        <motion.div
          key={`progress-${safeIdx}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50 origin-left z-20"
        />
      )}

      {/* ── Content overlay with responsive positioning ─────────────── */}
      <div className="absolute inset-0 flex items-end pb-16 px-[--section-px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${safeIdx}`}
            variants={contentVariants}
            initial="enter" 
            animate="center" 
            exit="exit"
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <HeroSlideContent item={item} heroLogo={heroLogo} />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
