import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GlassPanel, SectionHeader } from '@/shared/components/ui';
import type { VideoItem } from '@/shared/types/index';

interface TrailerExperienceProps {
  videos?: VideoItem[];
  synopsis?: string;
}

export function TrailerExperience({ videos, synopsis }: TrailerExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const trailers = useMemo(() =>
    (videos ?? []).filter(v => v.site === 'YouTube' && ['Trailer', 'Teaser'].includes(v.type)).slice(0, 6),
    [videos],
  );
  const [activeTrailer, setActiveTrailer] = useState(0);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const currentTrailer = trailers[activeTrailer];

  const handleTrailerSelect = useCallback((idx: number) => setActiveTrailer(idx), []);

  if (trailers.length === 0) return null;

  return (
    <section id="section-trailer" className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title="Trailers" subtitle={`${trailers.length} video${trailers.length > 1 ? 's' : ''} available`} />

        {/* Main player */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTrailer?.key}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassPanel className="overflow-hidden rounded-2xl">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentTrailer?.key}?rel=0&modestbranding=1`}
                  title={currentTrailer?.name || 'Trailer'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </GlassPanel>
          </motion.div>
        </AnimatePresence>

        {/* Below: synopsis + trailer selector */}
        <div className="flex gap-8 mt-6">
          {/* Synopsis */}
          {synopsis && (
            <div className="flex-[3] min-w-0">
              <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed ${synopsisExpanded ? '' : 'line-clamp-4'}`}>
                {synopsis}
              </p>
              <button
                onClick={() => setSynopsisExpanded(v => !v)}
                className="text-sm text-[var(--color-accent)] mt-2 hover:underline transition-colors"
              >
                {synopsisExpanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            </div>
          )}

          {/* Thumbnail list */}
          {trailers.length > 1 && (
            <div className="flex-[2] flex flex-col gap-2">
              {trailers.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => handleTrailerSelect(i)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl text-left
                    transition-all duration-200
                    ${i === activeTrailer
                      ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30'
                      : 'hover:bg-[var(--color-bg-elevated)]'
                    }
                  `}
                  aria-label={`Play ${t.name}`}
                >
                  <span className="text-sm text-[var(--color-text-muted)] w-6 text-center">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{t.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{t.type}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
