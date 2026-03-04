// HeroBanner.tsx — Exact replica of ImgSlider.js from Disney+ clone
//
// Carousel with dots · border-radius 4px · padding 4px → border 4px hover
// max-height 420px · autoplay 4s · title bottom-left
// Uses Framer Motion instead of react-slick

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate }         from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { CatalogMeta }    from '@/shared/types';

const TMDB = 'https://image.tmdb.org/t/p/';

function imgUrl(path: string | undefined | null, size = 'original'): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${TMDB}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface HeroBannerProps {
  items: CatalogMeta[];
}

// ── HeroBanner ────────────────────────────────────────────────────────────────

const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const slides = items.slice(0, 5);

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % slides.length);
  }, [slides.length]);

  // Autoplay every 4 seconds (matches ImgSlider.js autoplaySpeed)
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [slides.length, next, current]);

  if (slides.length === 0) return null;

  return (
    <div style={{ marginTop: 20, position: 'relative' }}>
      {/* Carousel container */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {slides.map((item, i) => {
            if (i !== current) return null;
            const bg = imgUrl(item.backdrop_path ?? item.background, 'original')
              ?? imgUrl(item.poster_path ?? item.poster, 'w1280');
            const title = item.title ?? item.name ?? '';
            const mediaType = item.media_type ?? item.type ?? 'movie';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ borderRadius: 4, cursor: 'pointer', position: 'relative' }}
                onClick={() => navigate(`/detail/${mediaType}/${item.id}`)}
              >
                {/* Wrap — exact ImgSlider.js: border-radius 4px, padding 4px, hover border */}
                <div
                  className="group/slide"
                  style={{
                    borderRadius: 4,
                    boxShadow: 'rgb(0 0 0 / 69%) 0px 26px 30px -10px, rgb(0 0 0 / 73%) 0px 16px 10px -10px',
                    cursor: 'pointer',
                    display: 'block',
                    position: 'relative',
                    padding: 4,
                  }}
                >
                  {bg && (
                    <img
                      src={bg}
                      alt={title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                        maxHeight: 420,
                      }}
                      draggable={false}
                    />
                  )}
                  {/* Title at bottom-left — exact ImgSlider.js SlideTitle */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: 20,
                      color: '#f9f9f9',
                      fontSize: 22,
                      fontWeight: 'bold',
                      textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                      letterSpacing: '1px',
                      pointerEvents: 'none',
                    }}
                  >
                    {title}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dots navigation — exact ImgSlider.js slick dots style */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginTop: 12,
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: i === current ? 'white' : 'rgb(150,158,171)',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export { HeroBanner };
