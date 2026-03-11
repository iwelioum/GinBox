import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GlassPanel, CinematicButton } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

interface WatchProgressProps {
  data: UseDetailDataResult;
  onResume: () => void;
}

export function WatchProgress({ data, onResume }: WatchProgressProps) {
  const { item, selectedEpisodeData, selectedEpisodeProgress } = data;
  const prefersReducedMotion = useReducedMotion();

  const progress = useMemo(() => {
    if (!selectedEpisodeProgress) return null;
    const pct = selectedEpisodeProgress.progressPct ?? 0;
    const remaining = selectedEpisodeProgress.durationMs && selectedEpisodeProgress.positionMs
      ? Math.ceil((selectedEpisodeProgress.durationMs - selectedEpisodeProgress.positionMs) / 60000)
      : null;
    return { pct, remaining };
  }, [selectedEpisodeProgress]);

  if (!progress || !item) return null;

  const thumbPath = selectedEpisodeData?.still_path || item.poster_path || item.poster;
  const thumbUrl = thumbPath ? buildTmdbImageUrl(thumbPath, 'w300') : null;
  const epTitle = selectedEpisodeData?.title || item.title || item.name || '';
  const epLabel = selectedEpisodeData
    ? `S${selectedEpisodeData.season} E${selectedEpisodeData.episode}`
    : '';

  return (
    <section className="relative px-16 py-4">
      <GlassPanel className="px-8 py-6">
        <div className="flex items-center gap-6">
          {thumbUrl && (
            <div className="aspect-video w-24 rounded-lg overflow-hidden flex-shrink-0">
              <img src={thumbUrl} alt="" sizes="96px" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-accent)] mb-1">Continue watching</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)] truncate">{epTitle}</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {epLabel}{progress.remaining ? ` · ${progress.remaining} min remaining` : ''}
            </p>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="w-full h-1 rounded-full bg-[var(--color-border)]">
              <motion.div
                className="h-full rounded-full bg-[var(--color-accent)]"
                initial={prefersReducedMotion ? false : { width: 0 }}
                animate={{ width: `${Math.min(progress.pct, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
          <CinematicButton onClick={onResume} aria-label="Resume playback">
            ▶ Resume
          </CinematicButton>
        </div>
      </GlassPanel>
    </section>
  );
}
