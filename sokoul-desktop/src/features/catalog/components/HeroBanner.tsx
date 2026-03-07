// HeroBanner.tsx — Cinematic hero v3
//
// Features:
//   • Ken Burns — motion.img scale 1.0 → 1.05 over 7s, reset on slide change
//   • Crossfade direction-aware — bg enters from right/left (x ±80px) 400ms
//                                  exit: scale(1.05) + opacity(0)
//                                  content: simple fadeUp (y 10→0) independent
//   • Dominant color via canvas 1×1px → dynamic left gradient
//   • Animated badge "New" / "Trending" (infinite pulse)
//   • Duration computed from runtime / episode_run_time
//   • Synopsis 3-line-clamp, rgba(249,249,249,0.8), maxWidth 500px
//   • Ripple effect + glow hover on "Watch" button
//   • Dots with thumbnail preview + counter "01 / 08"

import * as React        from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate }              from 'react-router-dom';
import { AnimatePresence, motion }  from 'framer-motion';
import { useQueries }               from '@tanstack/react-query';
import { Play, Info }               from 'lucide-react';
import { endpoints }                from '@/shared/api/client';
import { extractLogo }              from '@/shared/utils/tmdb';
import type { CatalogMeta }         from '@/shared/types';
import { TMDB_IMAGE_BASE }         from '@/shared/constants/tmdb';

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTOPLAY_MS   = 7000;
const MAX_SLIDES    = 8;
const DEFAULT_TINT  = 'rgba(4,7,20,0.97)';

// ── Helpers ───────────────────────────────────────────────────────────────────

function imgUrl(path: string | undefined | null, size = 'original'): string | null {
  if (!path) return null;
  if (path.startsWith('http')) {
    return path.replace('/w500/', '/original/').replace('/w1280/', '/original/');
  }
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

function getYear(item: CatalogMeta): string {
  const raw = item.release_date ?? item.first_air_date ?? String(item.year ?? '');
  return raw.substring(0, 4);
}

function getGenres(item: CatalogMeta): string[] {
  if (item.genre_names && item.genre_names.length > 0) return item.genre_names;
  if (Array.isArray(item.genres)) {
    return item.genres.map(g => (typeof g === 'string' ? g : g.name));
  }
  return [];
}

function formatDuration(item: CatalogMeta): string | null {
  const mins = item.runtime ?? item.episode_run_time?.[0];
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function computeBadge(item: CatalogMeta): 'new' | 'trending' | null {
  const dateStr = item.release_date ?? item.first_air_date;
  if (dateStr) {
    const days = (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
    if (days >= 0 && days <= 60) return 'new';
  }
  if ((item.popularity ?? 0) > 150) return 'trending';
  return null;
}

// ── Framer Motion variants ────────────────────────────────────────────────────

// Background: direction-aware on the x-axis — Ken Burns on the child motion.img
// enter: slide enters from the right (+1) or the left (-1)
// exit: slight zoom + fade, independent of direction
const bgVariants = {
  enter: (dir: number): { opacity: number; x: number; scale: number } => ({
    opacity: 0,
    x:       dir > 0 ? 80 : -80,   // ~5% of width → subtle directional entrance
    scale:   1.0,
  }),
  center: { opacity: 1, x: 0, scale: 1.0  },
  exit:   { opacity: 0, x: 0, scale: 1.05 }, // zoom + fade, 400ms
};

// Content: simple fadeUp independent of navigation direction
const contentVariants = {
  enter:  { opacity: 0, y: 10  },
  center: { opacity: 1, y: 0   },
  exit:   { opacity: 0, y: -5  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface HeroBannerProps {
  items: CatalogMeta[];
}

interface RippleItem {
  id: number;
  x:  number;
  y:  number;
}

// ── Ripple hook ───────────────────────────────────────────────────────────────

function useRipple(): {
  ripples:   RippleItem[];
  addRipple: (e: React.MouseEvent<HTMLButtonElement>) => void;
} {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id   = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  }, []);

  return { ripples, addRipple };
}

// ── HeroBanner ────────────────────────────────────────────────────────────────

const HeroBanner: React.FC<HeroBannerProps> = ({ items }) => {
  const navigate  = useNavigate();
  const slides    = items.slice(0, MAX_SLIDES);

  const [current,       setCurrent]       = useState(0);
  const [direction,     setDirection]     = useState(1);
  const [paused,        setPaused]        = useState(false);
  const [dominantTint,  setDominantTint]  = useState(DEFAULT_TINT);
  const [hoveredDot,    setHoveredDot]    = useState<number | null>(null);

  const { ripples, addRipple } = useRipple();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Autoplay ────────────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setDirection(1);
    setCurrent(i => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length <= 1 || paused) return;
    timerRef.current = setInterval(advance, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, paused, advance, current]);

  // ── Fanart logos (preloaded for all slides) ─────────────────────────────────
  const fanartQueries = useQueries({
    queries: slides.map(item => {
      const tmdbId     = item.id.includes(':') ? item.id.split(':').pop()! : item.id;
      const fanartType = (item.type === 'series' ? 'tv' : 'movie') as 'movie' | 'tv';
      return {
        queryKey:  ['hero-fanart-home', fanartType, tmdbId] as const,
        queryFn:   () => endpoints.fanart.get(fanartType, tmdbId).then(r => r.data),
        staleTime: Infinity,
      };
    }),
  });

  if (slides.length === 0) return null;

  const safeIdx   = Math.min(current, slides.length - 1);
  const item      = slides[safeIdx];
  const heroLogo  = extractLogo(fanartQueries[safeIdx]?.data);
  const title     = item.title ?? item.name ?? '';
  const synopsis  = item.overview ?? item.description ?? '';
  const year      = getYear(item);
  const rating    = item.vote_average ?? item.imdbRating;
  const genres    = getGenres(item);
  const duration  = formatDuration(item);
  const badge     = computeBadge(item);
  const mediaType = item.media_type ?? item.type ?? 'movie';
  const bgImg     = imgUrl(item.backdrop_path ?? item.background, 'original')
                 ?? imgUrl(item.poster_path ?? item.poster, 'w1280');

  // ── Dominant color extraction via canvas 1×1px ──────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const slide   = slides[safeIdx];
    if (!slide) return;
    const url = imgUrl(slide.backdrop_path ?? slide.background, 'original')
             ?? imgUrl(slide.poster_path   ?? slide.poster,    'w1280');
    if (!url) { setDominantTint(DEFAULT_TINT); return; }

    const img       = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas  = document.createElement('canvas');
        canvas.width  = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        // Darken the color for a subtle gradient
        const r = Math.min(Math.round(d[0] * 0.20), 32);
        const g = Math.min(Math.round(d[1] * 0.20), 32);
        const b = Math.min(Math.round(d[2] * 0.28), 46);
        setDominantTint(`rgba(${r},${g},${b},0.97)`);
      } catch (_err: unknown) {
        setDominantTint(DEFAULT_TINT);
      }
    };
    img.onerror = () => setDominantTint(DEFAULT_TINT);
    img.src = url;
  // safeIdx is the correct dependency: re-extract on each slide change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position:    'relative',
        marginLeft:  'calc(-3.5vw - 5px)',
        marginRight: 'calc(-3.5vw - 5px)',
        marginTop:   0,
        height:      '65vh',
        minHeight:    520,
        overflow:    'hidden',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* ── Background crossfade + Ken Burns ─────────────────────────────────── */}
      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={`bg-${safeIdx}`}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.4, ease: 'easeInOut' },
            x:       { duration: 0.4, ease: 'easeOut'   },
            scale:   { duration: 0.4, ease: 'easeOut'   },
          }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {bgImg ? (
            // separate motion.img = Ken Burns independent of crossfade
            <motion.img
              key={`img-${safeIdx}`}
              src={bgImg}
              alt=""
              initial={{ scale: 1.0 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              style={{
                width:          '100%',
                height:         '100%',
                objectFit:      'cover',
                objectPosition: 'center 20%',
                display:        'block',
              }}
              draggable={false}
            />
          ) : (
            <div style={{
              width:      '100%',
              height:     '100%',
              background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)',
            }} />
          )}

          {/* Left gradient — tinted with dominant color */}
          <div
            style={{
              position:   'absolute',
              inset:       0,
              background: `linear-gradient(to right, ${dominantTint} 16%, rgba(4,7,20,0.68) 50%, rgba(4,7,20,0.14) 78%, transparent 100%)`,
              transition: 'background 1.5s ease',
            }}
          />

          {/* Bottom gradient — fade to page background */}
          <div style={{
            position:   'absolute',
            inset:       0,
            background: 'linear-gradient(to top, rgba(4,7,20,1) 0%, rgba(4,7,20,0.60) 20%, rgba(4,7,20,0.10) 48%, transparent 65%)',
          }} />

          {/* Top vignette — softens the navigation bar */}
          <div style={{
            position:   'absolute',
            inset:       0,
            background: 'linear-gradient(to bottom, rgba(4,7,20,0.38) 0%, transparent 18%)',
          }} />
        </motion.div>
      </AnimatePresence>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      {!paused && slides.length > 1 && (
        <motion.div
          key={`progress-${safeIdx}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
          style={{
            position:        'absolute',
            bottom:           0,
            left:             0,
            right:            0,
            height:           2,
            background:      'rgba(255,255,255,0.52)',
            transformOrigin: 'left',
            zIndex:           20,
          }}
        />
      )}

      {/* ── Content panel ────────────────────────────────────────────────────── */}
      <div style={{
        position:      'absolute',
        inset:          0,
        display:       'flex',
        alignItems:    'flex-end',
        paddingBottom:  60,
        paddingLeft:   'calc(3.5vw + 5px)',
        paddingRight:  'calc(3.5vw + 5px)',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${safeIdx}`}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ maxWidth: 580 }}
          >

            {/* Animated badge "New" / "Trending" */}
            {badge && (
              <motion.div
                animate={{ opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ marginBottom: 12 }}
              >
                <span style={{
                  display:       'inline-flex',
                  alignItems:    'center',
                  gap:            4,
                  padding:       '3px 10px',
                  borderRadius:   20,
                  fontSize:       10,
                  fontWeight:     800,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase' as const,
                  background:    badge === 'new' ? 'rgba(0,99,229,0.82)' : 'rgba(220,80,0,0.82)',
                  color:         '#fff',
                  border:        `1px solid ${badge === 'new' ? 'rgba(100,160,255,0.35)' : 'rgba(255,130,50,0.35)'}`,
                }}>
                  {badge === 'new' ? '✦ New' : '▲ Trending'}
                </span>
              </motion.div>
            )}

            {/* Fanart HD logo or text title */}
            {heroLogo ? (
              <img
                src={heroLogo}
                alt={title}
                loading="lazy"
                style={{
                  maxHeight:    96,
                  maxWidth:     420,
                  objectFit:   'contain',
                  marginBottom: 18,
                  filter:      'drop-shadow(0 4px 28px rgba(0,0,0,0.95))',
                  display:     'block',
                }}
              />
            ) : (
              <h1 style={{
                fontSize:      'clamp(1.9rem, 3.8vw, 3.4rem)',
                fontWeight:     900,
                letterSpacing: '-0.035em',
                lineHeight:     1.06,
                marginBottom:   16,
                color:          '#f9f9f9',
                textShadow:    '0 2px 24px rgba(0,0,0,0.95)',
              }}>
                {title}
              </h1>
            )}

            {/* Enriched metadata: year · score · duration · genres */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:           6,
              marginBottom:  12,
              flexWrap:     'wrap',
            }}>
              {year && (
                <span style={{ fontSize: 12.5, color: 'rgba(249,249,249,0.55)', fontWeight: 500 }}>
                  {year}
                </span>
              )}
              {rating != null && rating > 0 && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 12.5, color: '#4ade80', fontWeight: 700 }}>
                    {Math.round(rating * 10)}%
                  </span>
                </>
              )}
              {duration && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(249,249,249,0.55)', fontWeight: 500 }}>
                    {duration}
                  </span>
                </>
              )}
              {genres.slice(0, 3).map(g => (
                <span key={g} style={{
                  fontSize:     10.5,
                  padding:     '2px 8px',
                  borderRadius:  5,
                  border:       '1px solid rgba(255,255,255,0.13)',
                  background:   'rgba(0,0,0,0.38)',
                  color:        'rgba(249,249,249,0.62)',
                  fontWeight:    500,
                }}>
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis 3 lines max */}
            {synopsis && (
              <p style={{
                fontSize:    14,
                color:       'rgba(249,249,249,0.80)',
                lineHeight:   1.65,
                marginBottom: 24,
                maxWidth:     500,
                display:     '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow:    'hidden',
              } as React.CSSProperties}>
                {synopsis}
              </p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

              {/* ▶ Watch — ripple + glow hover */}
              <motion.button
                onClick={(e) => { addRipple(e); navigate(`/detail/${mediaType}/${item.id}`); }}
                whileHover={{ boxShadow: '0 0 28px rgba(255,255,255,0.26)', scale: 1.025 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                style={{
                  position:      'relative',
                  overflow:      'hidden',
                  display:       'flex',
                  alignItems:    'center',
                  gap:            8,
                  padding:       '11px 26px',
                  borderRadius:   8,
                  background:    '#f9f9f9',
                  color:         '#040714',
                  fontSize:       14,
                  fontWeight:     700,
                  border:        'none',
                  cursor:        'pointer',
                  letterSpacing: '-0.01em',
                  userSelect:    'none',
                }}
              >
                {/* Ripple circles */}
                {ripples.map(r => (
                  <motion.span
                    key={r.id}
                    initial={{ scale: 0, opacity: 0.40 }}
                    animate={{ scale: 5,  opacity: 0    }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    style={{
                      position:      'absolute',
                      borderRadius:  '50%',
                      width:          64,
                      height:         64,
                      background:    'rgba(4,7,20,0.18)',
                      left:           r.x - 32,
                      top:            r.y - 32,
                      pointerEvents: 'none',
                    }}
                  />
                ))}
                <Play size={15} fill="#040714" strokeWidth={0} />
                Watch
              </motion.button>

              {/* ℹ More info */}
              <motion.button
                onClick={() => navigate(`/detail/${mediaType}/${item.id}`)}
                whileHover={{ scale: 1.025, background: 'rgba(255,255,255,0.10)' }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:             8,
                  padding:        '11px 22px',
                  borderRadius:    8,
                  background:    'rgba(0,0,0,0.38)',
                  color:          '#f9f9f9',
                  fontSize:        14,
                  fontWeight:      600,
                  border:        '1px solid rgba(255,255,255,0.25)',
                  cursor:        'pointer',
                  letterSpacing: '-0.01em',
                  backdropFilter: 'blur(8px)',
                  userSelect:    'none',
                }}
              >
                <Info size={15} />
                More info
              </motion.button>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Dots with preview + counter ────────────────────────────────────── */}
      {slides.length > 1 && (
        <div style={{
          position:   'absolute',
          bottom:      22,
          right:      'calc(3.5vw + 5px)',
          display:    'flex',
          alignItems: 'center',
          gap:         6,
          zIndex:      10,
        }}>
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
                        position:      'absolute',
                        bottom:        '100%',
                        left:          -54,       // ~center the 120px tooltip on the dot
                        marginBottom:   10,
                        width:          120,
                        height:         68,
                        borderRadius:   7,
                        overflow:      'hidden',
                        boxShadow:    '0 6px 28px rgba(0,0,0,0.88)',
                        border:       '1px solid rgba(255,255,255,0.13)',
                        pointerEvents: 'none',
                        zIndex:         30,
                      }}
                    >
                      <img
                        src={thumbBg}
                        alt=""
                        style={{
                          width:          '100%',
                          height:         '100%',
                          objectFit:      'cover',
                          objectPosition: 'center 20%',
                        }}
                        draggable={false}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dot pill */}
                <button
                  onClick={() => {
                    setDirection(i > safeIdx ? 1 : -1);
                    setCurrent(i);
                    setPaused(false);
                  }}
                  aria-label={`Slide ${i + 1}`}
                  style={{
                    width:        isActive ? 22 : 6,
                    height:       6,
                    borderRadius: 3,
                    border:      'none',
                    cursor:      'pointer',
                    padding:      0,
                    display:     'block',
                    background:   isActive ? '#f9f9f9' : 'rgba(255,255,255,0.30)',
                    transition:  'width 0.3s ease, background 0.2s ease',
                  }}
                />
              </div>
            );
          })}

          {/* Counter "01 / 08" */}
          <span style={{
            fontSize:      10.5,
            color:         'rgba(255,255,255,0.36)',
            fontWeight:     600,
            letterSpacing: '0.06em',
            marginLeft:     8,
          }}>
            {String(safeIdx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
      )}

    </div>
  );
};

export { HeroBanner };
