// HeroIndicators.tsx -- Dot navigation with thumbnail previews, slide counter,
// and auto-advance progress bar (resets via key={safeIdx}).

import * as React            from 'react';
import { useState }          from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CatalogMeta }  from '@/shared/types';
import { imgUrl, AUTOPLAY_MS } from './heroBannerUtils';

export interface HeroIndicatorsProps {
  slides:   CatalogMeta[];
  safeIdx:  number;
  paused:   boolean;
  onSelect: (index: number) => void;
}

export const HeroIndicators: React.FC<HeroIndicatorsProps> = ({
  slides, safeIdx, paused, onSelect,
}) => {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  return (
    <div className="absolute bottom-[22px] right-[calc(3.5vw+5px)] z-10
                    flex flex-col items-end gap-2">
      {/* Dots row */}
      <div className="flex items-center gap-1.5">
        {slides.map((slide, i) => {
          const thumbBg  = imgUrl(slide.backdrop_path ?? slide.background, 'w300')
                        ?? imgUrl(slide.poster_path   ?? slide.poster,    'w300');
          const isActive = i === safeIdx;

          return (
            <div
              key={i}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredDot(i)}
              onMouseLeave={() => setHoveredDot(null)}
            >
              {/* Preview thumbnail on hover */}
              <AnimatePresence>
                {hoveredDot === i && thumbBg && (
                  <motion.div
                    key={`preview-${i}`}
                    initial={{ opacity: 0, y: 8,  scale: 0.88 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: 8,  scale: 0.88 }}
                    transition={{ duration: 0.17 }}
                    style={{
                      position: 'absolute', bottom: '100%', left: -54, marginBottom: 10,
                      width: 120, height: 68, borderRadius: 7, overflow: 'hidden',
                      boxShadow: '0 6px 28px rgba(0,0,0,0.88)',
                      border: '1px solid rgba(255,255,255,0.13)',
                      pointerEvents: 'none', zIndex: 30,
                    }}
                  >
                    <img
                      src={thumbBg}
                      alt=""
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center 20%',
                      }}
                      draggable={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dot pill */}
              <button
                onClick={() => onSelect(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: isActive ? 22 : 6, height: 6, borderRadius: 3,
                  border: 'none', cursor: 'pointer', padding: 0, display: 'block',
                  background: isActive ? 'var(--color-text-primary)' : 'rgba(255,255,255,0.30)',
                  transition: 'width 0.3s ease, background 0.2s ease',
                }}
              />
            </div>
          );
        })}

        {/* Counter "01 / 08" */}
        <span style={{
          fontSize: 10.5, color: 'rgba(255,255,255,0.36)', fontWeight: 600,
          letterSpacing: '0.06em', marginLeft: 8,
        }}>
          {String(safeIdx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
      </div>

      {/* Progress bar — resets on slide change via key */}
      {slides.length > 1 && (
        <div className="w-full h-[2px] rounded-full bg-white/[0.12] overflow-hidden">
          <motion.div
            key={safeIdx}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: paused ? 0 : 1 }}
            transition={paused ? { duration: 0 } : { duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
            className="h-full w-full rounded-full bg-white/[0.52] origin-left"
          />
        </div>
      )}
    </div>
  );
};
