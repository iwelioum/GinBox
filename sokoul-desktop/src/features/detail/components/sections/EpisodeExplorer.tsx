import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GlassPanel, SectionHeader, CinematicButton } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface EpisodeExplorerProps {
  data: UseDetailDataResult;
  onWatchEpisode: (season: number, episode: number, resumeAt?: number) => void;
}

export function EpisodeExplorer({ data, onWatchEpisode }: EpisodeExplorerProps) {
  const {
    seasons, selectedSeason, setSelectedSeason,
    episodesOfSeason, selectedEpisodeData, selectedEpisode, setSelectedEpisode,
    getEpisodeProgress, isSeries,
  } = data;
  const prefersReducedMotion = useReducedMotion();
  const [hoveredEp, setHoveredEp] = useState<number | null>(null);

  const spotlightEp = selectedEpisodeData;
  const spotlightProgress = useMemo(
    () => getEpisodeProgress(spotlightEp?.season, spotlightEp?.episode),
    [getEpisodeProgress, spotlightEp?.season, spotlightEp?.episode],
  );

  const handlePlaySpotlight = useCallback(() => {
    if (!spotlightEp) return;
    onWatchEpisode(
      spotlightEp.season ?? 1,
      spotlightEp.episode ?? 1,
      spotlightProgress?.positionMs,
    );
  }, [spotlightEp, spotlightProgress, onWatchEpisode]);

  if (!isSeries || seasons.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title="Episodes" subtitle={`${episodesOfSeason.length} episodes in season ${selectedSeason}`} />

        {/* Spotlight card — cinematic featured episode */}
        {spotlightEp && (
          <GlassPanel className="flex flex-col lg:flex-row overflow-hidden mb-8 card-elevated group">
            <div className="lg:w-2/5 aspect-video overflow-hidden relative">
              {spotlightEp.still_path ? (
                <img
                  src={buildTmdbImageUrl(spotlightEp.still_path, 'w780') ?? undefined}
                  alt={spotlightEp.title || ''}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full shimmer" />
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/80 backdrop-blur-sm flex items-center justify-center shadow-[var(--depth-accent-glow)]">
                  <span className="text-2xl text-white ml-1">▶</span>
                </div>
              </div>
            </div>
            <div className="lg:w-3/5 p-8 flex flex-col justify-center">
              <p className="text-sm font-medium text-[var(--color-accent)] mb-2">Now Spotlighting</p>
              <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] font-[var(--font-display)] mb-1">
                {spotlightEp.title || `Episode ${spotlightEp.episode}`}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                S{spotlightEp.season} · E{spotlightEp.episode}
                {spotlightEp.runtime ? ` · ${spotlightEp.runtime} min` : ''}
              </p>
              {spotlightEp.overview && (
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-4 leading-relaxed">
                  {spotlightEp.overview}
                </p>
              )}
              {spotlightProgress && (
                <div className="w-full max-w-xs h-1 rounded-full bg-[var(--color-border)] mb-4">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                    style={{ width: `${Math.min(spotlightProgress.progressPct, 100)}%` }}
                  />
                </div>
              )}
              <CinematicButton onClick={handlePlaySpotlight} aria-label="Play episode" className="self-start">
                ▶ Play Episode
              </CinematicButton>
            </div>
          </GlassPanel>
        )}

        {/* Season selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {seasons.map(s => (
            <button
              key={s}
              onClick={() => { setSelectedSeason(s); setSelectedEpisode(1); }}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${s === selectedSeason
                  ? 'bg-[var(--color-accent)] text-white shadow-[var(--depth-accent-glow)]'
                  : 'bg-[var(--color-bg-glass)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }
              `}
              aria-label={`Season ${s}`}
              aria-current={s === selectedSeason ? 'true' : undefined}
            >
              Season {s}
            </button>
          ))}
        </div>

        {/* Episode grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSeason}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {episodesOfSeason.map(ep => {
              const prog = getEpisodeProgress(ep.season, ep.episode);
              const isActive = ep.episode === selectedEpisode;
              return (
                <motion.button
                  key={`${ep.season}-${ep.episode}`}
                  variants={fadeUp}
                  onClick={() => setSelectedEpisode(ep.episode ?? 1)}
                  onDoubleClick={() => onWatchEpisode(ep.season ?? 1, ep.episode ?? 1, prog?.positionMs)}
                  onMouseEnter={() => setHoveredEp(ep.episode ?? null)}
                  onMouseLeave={() => setHoveredEp(null)}
                  className={`
                    group relative aspect-video rounded-xl overflow-hidden text-left
                    transition-all duration-200
                    ${isActive ? 'ring-2 ring-[var(--color-accent)] shadow-[var(--depth-accent-glow)]' : ''}
                    hover:shadow-[0_10px_40px_rgba(108,99,255,0.2)]
                  `}
                  aria-label={ep.title || `Episode ${ep.episode}`}
                >
                  {ep.still_path ? (
                    <img
                      src={buildTmdbImageUrl(ep.still_path, 'w400') ?? undefined}
                      alt=""
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full shimmer" />
                  )}

                  {/* Hover overlay */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent
                    flex flex-col justify-end p-3 transition-opacity duration-200
                    ${hoveredEp === ep.episode || prefersReducedMotion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}>
                    <p className="text-sm font-medium text-white truncate">{ep.title || `Episode ${ep.episode}`}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      E{ep.episode}{ep.runtime ? ` · ${ep.runtime}m` : ''}
                    </p>
                  </div>

                  {/* Progress bar */}
                  {prog && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-border)]">
                      <div className="h-full bg-[var(--color-accent)]" style={{ width: `${prog.progressPct}%` }} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
