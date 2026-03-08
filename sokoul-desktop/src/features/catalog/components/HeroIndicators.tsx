// HeroIndicators.tsx — Premium dot navigation with smooth transitions

import * as React            from 'react';
import { useState }          from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CatalogMeta }  from '@/shared/types';
import { imgUrl }            from './heroBannerUtils';

export interface HeroIndicatorsProps {
  slides:   CatalogMeta[];
  safeIdx:  number;
  onSelect: (index: number) => void;
}

export const HeroIndicators: React.FC<HeroIndicatorsProps> = ({
  slides, safeIdx, onSelect,
}) => {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  return (
    <div className="absolute bottom-6 right-[--section-px] flex items-center gap-1.5 z-10">
      {slides.map((slide, i) => {
        const thumbBg  = imgUrl(slide.backdrop_path ?? slide.background, 'w300')
                      ?? imgUrl(slide.poster_path   ?? slide.poster,    'w300');
        const isActive = i === safeIdx;

        return (
          <div
            key={i}
            className="relative"
            onMouseEnter={() => setHoveredDot(i)}
            onMouseLeave={() => setHoveredDot(null)}
          >
            {/* Preview thumbnail on hover */}
            <AnimatePresence>
              {hoveredDot === i && thumbBg && (
                <motion.div
                  key={`preview-${i}`}
                  initial={{ opacity: 0, y: 8,  scale: 0.9 }}
                  animate={{ opacity: 1, y: 0,  scale: 1  }}
                  exit={{    opacity: 0, y: 8,  scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-32 h-20 rounded-lg overflow-hidden shadow-2xl border border-white/15 pointer-events-none z-30"
                >
                  <img
                    src={thumbBg}
                    alt=""
                    className="w-full h-full object-cover object-[center_20%]"
                    draggable={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium dot indicator */}
            <button
              onClick={() => onSelect(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full border-none cursor-pointer p-0 block transition-all duration-300 ${
                isActive 
                  ? 'w-6 bg-white' 
                  : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
            />
          </div>
        );
      })}

      {/* Modern slide counter */}
      <span className="text-[10px] text-white/40 font-semibold tracking-wider ml-2">
        {String(safeIdx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </span>
    </div>
  );
};
