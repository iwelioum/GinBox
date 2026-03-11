// DetailEpisodes.tsx — Netflix-style episode picker
// Season selector + episode list, no dead tabs

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Tv, Play } from 'lucide-react';
import { EpisodeCard } from './EpisodeCard';
import type { EpisodeVideo, PlaybackEntry } from '@/shared/types/index';

interface DetailEpisodesProps {
  seasons: number[];
  episodesOfSeason: EpisodeVideo[];
  episodeVideos: EpisodeVideo[];
  selectedSeason: number;
  selectedEpisode: number;
  selectedEpisodeData: EpisodeVideo | undefined;
  getEpisodeProgress: (season?: number, episode?: number) => PlaybackEntry | undefined;
  isPlayLoading: boolean;
  onSelectSeason: (season: number) => void;
  onSelectEpisode: (episode: number) => void;
  onWatchEpisode: (season: number, episode: number, resumeAt?: number) => Promise<void>;
}

function getImageUrl(path: string | undefined, size: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const DetailEpisodes: React.FC<DetailEpisodesProps> = ({
  seasons, episodesOfSeason, episodeVideos,
  selectedSeason, selectedEpisode, selectedEpisodeData,
  getEpisodeProgress, isPlayLoading,
  onSelectSeason, onSelectEpisode, onWatchEpisode,
}) => {
  const { t } = useTranslation();

  const previewProgress = getEpisodeProgress(selectedEpisodeData?.season, selectedEpisodeData?.episode);
  const previewCanResume = !!previewProgress && !previewProgress.watched && (previewProgress.positionMs ?? 0) > 0;
  const previewStill = getImageUrl(selectedEpisodeData?.still_path, 'w780');
  const episodeCount = episodesOfSeason.length;

  return (
    <section className="space-y-5">
      {/* Header with season selector */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
          {t('detail.seasonEpisode')}
        </h2>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--color-white-8)]">
          {seasons.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onSelectSeason(s);
                const first = episodeVideos.find(v => v.season === s)?.episode ?? 1;
                onSelectEpisode(first);
              }}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium
                         transition-all duration-200 border
                         focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none ${
                selectedSeason === s
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-medium)] hover:text-[var(--color-text-primary)]'
              }`}
              aria-pressed={selectedSeason === s}
            >
              {t('detail.seasonNumber', { number: s })}
            </button>
          ))}
        </div>

        {episodeCount > 0 && (
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">
            {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
          </span>
        )}
      </div>

      {/* Selected episode preview */}
      <AnimatePresence mode="wait">
        {selectedEpisodeData && (
          <motion.div
            key={`${selectedEpisodeData.season}-${selectedEpisodeData.episode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-5 rounded-xl overflow-hidden bg-[var(--color-bg-elevated)]
                       border border-[var(--color-border)] group"
          >
            {/* Still image */}
            <div className="relative flex-shrink-0 w-[280px] aspect-video bg-[var(--color-bg-overlay)]">
              {previewStill ? (
                <img src={previewStill} className="w-full h-full object-cover" alt={selectedEpisodeData.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                  S{String(selectedEpisodeData.season).padStart(2, '0')}E{String(selectedEpisodeData.episode).padStart(2, '0')}
                </div>
              )}
              {previewProgress && previewProgress.progressPct > 0 && !previewProgress.watched && (
                <div className="absolute left-0 right-0 bottom-0 h-1 bg-[var(--color-white-8)]">
                  <div className="h-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, previewProgress.progressPct)}%` }} />
                </div>
              )}
              {/* Play overlay */}
              <button
                type="button"
                onClick={() => void onWatchEpisode(
                  selectedEpisodeData.season ?? selectedSeason,
                  selectedEpisodeData.episode ?? 1,
                  previewCanResume ? previewProgress?.positionMs : undefined,
                )}
                disabled={isPlayLoading}
                className="absolute inset-0 flex items-center justify-center bg-black/0
                           hover:bg-black/30 transition-colors cursor-pointer
                           focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
                aria-label={previewCanResume ? t('detail.resumeButton') : t('detail.playButton')}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-white-15)] backdrop-blur-sm
                                flex items-center justify-center opacity-0 group-hover:opacity-100
                                transition-opacity duration-200 border border-[var(--color-white-20)]">
                  <Play size={20} className="fill-white text-white ml-0.5" />
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="py-4 pr-4 flex flex-col justify-center gap-2 flex-1 min-w-0">
              <p className="text-xs text-[var(--color-text-muted)]">
                S{String(selectedEpisodeData.season).padStart(2, '0')}E{String(selectedEpisodeData.episode).padStart(2, '0')}
                {selectedEpisodeData.runtime ? ` · ${selectedEpisodeData.runtime} ${t('common.min')}` : ''}
              </p>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {selectedEpisodeData.title ?? `Episode ${selectedEpisodeData.episode}`}
              </h4>
              {selectedEpisodeData.overview && (
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                  {selectedEpisodeData.overview}
                </p>
              )}
              <button
                type="button"
                onClick={() => void onWatchEpisode(
                  selectedEpisodeData.season ?? selectedSeason,
                  selectedEpisodeData.episode ?? 1,
                  previewCanResume ? previewProgress?.positionMs : undefined,
                )}
                disabled={isPlayLoading}
                className="self-start mt-1 bg-[var(--color-accent)] text-white text-xs font-semibold
                           px-5 py-2 rounded-full hover:bg-[var(--color-accent-hover)]
                           transition-colors duration-200 disabled:opacity-70 disabled:cursor-default"
              >
                {previewCanResume ? t('detail.resumeButton') : t('detail.playButton')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Episode list */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1
                      scrollbar-thin scrollbar-thumb-[var(--color-white-8)] scrollbar-track-transparent">
        {episodesOfSeason.length === 0 && (
          <EmptyState
            icon={<Tv />}
            title={t('detail.noEpisodes', { defaultValue: 'No episodes available' })}
            description={t('detail.noEpisodesDesc', { defaultValue: 'This season doesn\'t have any episodes yet.' })}
          />
        )}
        {episodesOfSeason.map(ep => (
          <EpisodeCard
            key={`${ep.season}-${ep.episode}`}
            ep={ep}
            isSelected={selectedEpisode === ep.episode}
            selectedSeason={selectedSeason}
            isPlayLoading={isPlayLoading}
            progress={getEpisodeProgress(ep.season, ep.episode)}
            onSelectEpisode={onSelectEpisode}
            onWatchEpisode={onWatchEpisode}
          />
        ))}
      </div>
    </section>
  );
};
