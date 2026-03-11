// EpisodeCard.tsx — Single episode card in the episode list
// Extracted from DetailEpisodes.tsx to keep it under 300 lines (AGENTS.md Rule 4).

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '@/shared/utils/time';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import type { EpisodeVideo, PlaybackEntry } from '@/shared/types/index';

function getImageUrl(path: string | undefined, size: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

const Thumbnail: React.FC<{
  stillUrl?: string;
  episode?: number;
  progress?: PlaybackEntry;
}> = ({ stillUrl, episode, progress }) => {
  const showBar = !!progress && progress.progressPct > 0 && !progress.watched;

  return (
    <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-[var(--radius-card)] 
                    overflow-hidden bg-[var(--color-bg-elevated)] flex items-center justify-center">
      {stillUrl ? (
        <img
          src={stillUrl}
          className="w-full h-full object-cover"
          alt={`Episode ${episode ?? ''}`}
          loading="lazy"
        />
      ) : (
        <span className="text-xs text-[var(--color-text-muted)]">E{episode ?? '?'}</span>
      )}
      {showBar && (
        <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-black/60">
          <div
            className="h-full bg-[var(--color-accent)]"
            style={{ width: `${Math.min(progress.progressPct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

interface EpisodeCardProps {
  ep: EpisodeVideo;
  isSelected: boolean;
  selectedSeason: number;
  isPlayLoading: boolean;
  progress?: PlaybackEntry;
  onSelectEpisode: (episode: number) => void;
  onWatchEpisode: (season: number, episode: number, resumeAt?: number) => Promise<void>;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  ep, isSelected, selectedSeason, isPlayLoading, progress,
  onSelectEpisode, onWatchEpisode,
}) => {
  const { t } = useTranslation();
  const stillUrl = getImageUrl(ep.still_path, 'w300');
  const canResume = !!progress && !progress.watched && (progress.positionMs ?? 0) > 0;

  return (
    <div
      onClick={() => onSelectEpisode(ep.episode ?? 1)}
      className={`group flex items-start gap-4 p-4 rounded-[var(--radius-card)] 
                 cursor-pointer transition-colors duration-200 ${
        isSelected
          ? 'bg-[var(--color-bg-overlay)] ring-1 ring-[var(--color-border)]'
          : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-overlay)]'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectEpisode(ep.episode ?? 1);
        }
      }}
    >
      <Thumbnail stillUrl={stillUrl} episode={ep.episode} progress={progress} />

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
            {t('detail.episodeNumber', { number: ep.episode }).replace('{{number}}', ep.episode?.toString() || '1')}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {ep.title ?? `Episode ${ep.episode}`}
          </span>
          {ep.runtime && (
            <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0 ml-auto">
              {ep.runtime} {t('common.min')}
            </span>
          )}
        </div>

        {ep.overview && (
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
            {ep.overview}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          {progress?.watched && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full 
                             border border-green-400/20">
              {t('detail.watched')}
            </span>
          )}
          {canResume && (
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full 
                             border border-yellow-400/20">
              {t('detail.resumeAt', { time: formatDuration(progress.positionMs) })}
            </span>
          )}

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              void onWatchEpisode(
                ep.season ?? selectedSeason,
                ep.episode ?? 1,
                canResume ? progress?.positionMs : undefined,
              );
            }}
            disabled={isPlayLoading}
            className={`ml-auto bg-[var(--color-accent)] text-white text-xs font-semibold 
                       px-4 py-2 rounded-[var(--radius-card)] hover:bg-[var(--color-accent-hover)] 
                       transition-all duration-200 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } ${isPlayLoading ? 'cursor-default opacity-70' : ''}`}
          >
            {canResume ? t('detail.resumeButton') : t('detail.playButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
