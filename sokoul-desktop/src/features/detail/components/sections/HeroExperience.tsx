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

const contentStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const contentItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroExperience({ data, onPlay, onToggleFavorite, isPlayLoading, isFavorite }: HeroExperienceProps) {
  const { item, logoUrl, isSeries } = data;
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 800], [0, -300]);
  const backdropScale = useTransform(scrollY, [0, 400], [1.08, 1]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);
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
  const episodeCount = item?.number_of_episodes;
  const synopsis = item?.overview || item?.description || '';
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
    if (isSeries && episodeCount) c.push({ icon: '🎬', label: `${episodeCount} episodes` });
    if (!isSeries && runtime) c.push({ icon: '⏱', label: `${runtime} min` });
    genres.forEach(g => c.push({ icon: '🎭', label: g }));
    if (studio) c.push({ icon: '🏢', label: studio });
    return c;
  }, [rating, year, isSeries, seasonCount, episodeCount, runtime, genres, studio]);

  const handleScrollToTrailer = useCallback(() => {
    document.getElementById('section-trailer')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (!item) return null;

  return (
    <section className="relative w-full overflow-hidden" style={{ height: 'var(--detail-hero-height)' }}>
      {/* Layer 1 — Backdrop image with parallax + breathing */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={prefersReducedMotion ? undefined : { y: backdropY, scale: backdropScale }}
      >
        {backdropUrl && (
          <>
            <img
              src={backdropUrl}
              alt=""
              sizes="100vw"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-[120%] object-cover transition-opacity duration-1000 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          </>
        )}
      </motion.div>

      {/* Layer 2 — Cinematic vignette */}
      <div className="hero-vignette" />

      {/* Layer 3 — Atmospheric lighting */}
      <div className="hero-light" />
      <div className="hero-glow" />

      {/* Layer 4 — Bottom gradient fade */}
      <div className="hero-gradient" />

      {/* Layer 5 — Content with scroll fade */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 px-16 pb-16 z-10"
        style={prefersReducedMotion ? undefined : { opacity: contentOpacity }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            variants={contentStagger}
            initial="hidden"
            animate="visible"
          >
            {/* Tagline */}
            {tagline && (
              <motion.p
                variants={contentItem}
                className="text-sm font-medium tracking-[0.2em] uppercase text-[var(--color-accent)] mb-4"
              >
                {tagline}
              </motion.p>
            )}

            {/* Title or Logo */}
            <motion.div variants={contentItem}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={title}
                  className="max-h-28 max-w-xl object-contain mb-6 drop-shadow-2xl"
                />
              ) : (
                <h1 className="text-7xl font-bold tracking-tight text-[var(--color-text-primary)] font-[var(--font-display)] mb-6 max-w-4xl leading-[1.05] drop-shadow-2xl">
                  {title}
                </h1>
              )}
            </motion.div>

            {/* Synopsis excerpt */}
            {synopsis && (
              <motion.p
                variants={contentItem}
                className="text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed line-clamp-2 mb-6"
              >
                {synopsis}
              </motion.p>
            )}

            {/* Chips */}
            <motion.div variants={contentItem} className="flex flex-wrap items-center gap-3 mb-8">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className="px-4 py-1.5 rounded-full bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)] text-sm backdrop-blur-md text-[var(--color-text-secondary)] shadow-[var(--depth-base)]"
                >
                  {chip.icon} {chip.label}
                </span>
              ))}
            </motion.div>

            {/* Action buttons */}
            <motion.div variants={contentItem} className="flex items-center gap-4">
              <CinematicButton onClick={onPlay} disabled={isPlayLoading} aria-label="Play" className="text-base px-8 py-4 shadow-2xl">
                {isPlayLoading ? '⏳ Loading…' : '▶ Play'}
              </CinematicButton>
              <CinematicButton variant="secondary" onClick={handleScrollToTrailer} aria-label="Watch trailer" className="shadow-lg">
                ◉ Trailer
              </CinematicButton>
              <CinematicButton variant="ghost" onClick={onToggleFavorite} aria-label={isFavorite ? 'Remove from list' : 'Add to list'}>
                {isFavorite ? '✓ Listed' : '+ Watchlist'}
              </CinematicButton>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
