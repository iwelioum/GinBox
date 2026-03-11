import { useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import { CinematicButton } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

interface HeroExperienceProps {
  data: UseDetailDataResult;
  onPlay: () => void;
  onToggleFavorite: () => void;
  isPlayLoading: boolean;
  isFavorite: boolean;
}

export function HeroExperience({ data, onPlay, onToggleFavorite, isPlayLoading, isFavorite }: HeroExperienceProps) {
  const { item, logoUrl, isSeries } = data;
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 600], [0, -240]);
  const [imgLoaded, setImgLoaded] = useState(false);

  const backdropUrl = useMemo(() => {
    const path = item?.backdrop_path || item?.background;
    return path ? buildTmdbImageUrl(path, 'original') : null;
  }, [item?.backdrop_path, item?.background]);

  const title = item?.title || item?.name || '';
  const tagline = item?.tagline;
  const rating = item?.vote_average;
  const year = item?.year ?? (item?.release_date ? new Date(item.release_date).getFullYear() : null);
  const runtime = item?.runtime;
  const seasonCount = item?.number_of_seasons;
  const genres = useMemo(() =>
    (item?.genres ?? []).map(g => typeof g === 'string' ? g : g.name).slice(0, 2),
    [item?.genres],
  );
  const studio = item?.studio;

  const chips = useMemo(() => {
    const c: { icon: string; label: string }[] = [];
    if (rating != null) c.push({ icon: '⭐', label: rating.toFixed(1) });
    if (year) c.push({ icon: '🎬', label: String(year) });
    if (isSeries && seasonCount) c.push({ icon: '📺', label: `${seasonCount} season${seasonCount > 1 ? 's' : ''}` });
    if (!isSeries && runtime) c.push({ icon: '⏱', label: `${runtime} min` });
    genres.forEach(g => c.push({ icon: '🎭', label: g }));
    if (studio) c.push({ icon: '🏢', label: studio });
    return c;
  }, [rating, year, isSeries, seasonCount, runtime, genres, studio]);

  const handleScrollToTrailer = useCallback(() => {
    document.getElementById('section-trailer')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (!item) return null;

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 'var(--detail-hero-height)' }}>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={prefersReducedMotion ? undefined : { y: backdropY }}
      >
        {backdropUrl && (
          <>
            <img
              src={backdropUrl}
              alt=""
              sizes="100vw"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover backdrop-breathe transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          </>
        )}
      </motion.div>

      {/* Atmospheric layers */}
      <div className="hero-glow" />
      <div className="hero-vignette" />
      <div className="hero-gradient" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-16 pb-16 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Tagline */}
            {tagline && (
              <p className="text-sm font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
                {tagline}
              </p>
            )}

            {/* Title or Logo */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={title}
                className="max-h-24 max-w-lg object-contain mb-4"
              />
            ) : (
              <h1 className="text-6xl font-bold tracking-tight text-[var(--color-text-primary)] font-[var(--font-display)] mb-4 max-w-3xl leading-tight">
                {title}
              </h1>
            )}

            {/* Chips */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border)] text-sm backdrop-blur-sm text-[var(--color-text-secondary)]"
                >
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <CinematicButton onClick={onPlay} disabled={isPlayLoading} aria-label="Play">
                {isPlayLoading ? '⏳ Loading…' : '▶ Play'}
              </CinematicButton>
              <CinematicButton variant="secondary" onClick={handleScrollToTrailer} aria-label="Watch trailer">
                ◉ Trailer
              </CinematicButton>
              <CinematicButton variant="ghost" onClick={onToggleFavorite} aria-label={isFavorite ? 'Remove from list' : 'Add to list'}>
                {isFavorite ? '✓ Listed' : '+ Watchlist'}
              </CinematicButton>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
