// DetailEpisodes.tsx — season/episode picker for series detail view

import * as React from 'react';
import { formatDuration } from '@/shared/utils/time';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
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

const Thumbnail: React.FC<{
  stillUrl?: string;
  episode?: number;
  progress?: PlaybackEntry;
}> = ({ stillUrl, episode, progress }) => {
  const showBar = !!progress && progress.progressPct > 0 && !progress.watched;
  return (
    <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-[6px] overflow-hidden bg-dp-text/10 flex items-center justify-center">
      {stillUrl ? (
        <img
          src={stillUrl}
          className="w-full h-full object-cover"
          loading="lazy"
          alt={`Episode ${episode}`}
        />
      ) : (
        <span className="text-dp-text/20 text-xs">E{episode}</span>
      )}
      {showBar && (
        <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-dp-text/20">
          <div
            className="h-full bg-dp-text/70"
            style={{ width: `${Math.min(100, Math.max(0, progress.progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const DetailEpisodes: React.FC<DetailEpisodesProps> = ({
  seasons, episodesOfSeason, episodeVideos,
  selectedSeason, selectedEpisode, selectedEpisodeData,
  getEpisodeProgress, isPlayLoading,
  onSelectSeason, onSelectEpisode, onWatchEpisode,
}) => (
  <section className="max-w-[1400px] mx-auto px-[calc(3.5vw+5px)] pb-4">
    <div className="rounded-[10px] border-[3px] border-dp-text/10 bg-black/40 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-dp-text/85 m-0">Season & episode</h2>
        {selectedEpisodeData && (
          <span className="text-xs text-dp-text/45">
            S{String(selectedSeason).padStart(2, '0')}E{String(selectedEpisode).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
        {seasons.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => {
              onSelectSeason(s);
              const first = episodeVideos.find(v => v.season === s)?.episode ?? 1;
              onSelectEpisode(first);
            }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-[4px] text-xs font-medium transition-all duration-200 ${
              selectedSeason === s
                ? 'bg-dp-text text-black'
                : 'bg-dp-text/10 text-dp-text/60 hover:bg-dp-text/20'
            }`}
          >
            Season {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {episodesOfSeason.map(ep => {
          const stillUrl = getImageUrl(ep.still_path, 'w300');
          const isSelected = selectedEpisode === ep.episode;
          const progress = getEpisodeProgress(ep.season, ep.episode);
          const canResume = !!progress && !progress.watched && (progress.positionMs ?? 0) > 0;
          return (
            <div
              key={`${ep.season}-${ep.episode}`}
              onClick={() => onSelectEpisode(ep.episode ?? 1)}
              className={`group flex items-start gap-3 p-3 rounded-[6px] text-left cursor-pointer transition-colors duration-200 ${
                isSelected
                  ? 'bg-dp-text/[0.08] ring-1 ring-dp-text/25'
                  : 'bg-dp-text/[0.04] hover:bg-dp-text/[0.07]'
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

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dp-text/35 flex-shrink-0">{ep.episode}</span>
                  <span className="text-sm font-medium text-dp-text/85 truncate">
                    {ep.title ?? `Episode ${ep.episode}`}
                  </span>
                  {ep.runtime && (
                    <span className="text-xs text-dp-text/30 flex-shrink-0 ml-auto">
                      {ep.runtime} min
                    </span>
                  )}
                </div>
                {ep.overview && (
                  <p className="text-[11px] text-dp-text/45 line-clamp-2 leading-relaxed">
                    {ep.overview}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {progress?.watched && (
                    <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                      ✓ Watched
                    </span>
                  )}
                  {canResume && (
                    <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                      ↩ Resume at {formatDuration(progress.positionMs)}
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
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-dp-text text-black text-xs font-bold hover:bg-dp-text/90 transition-all duration-200 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } ${isPlayLoading ? 'cursor-default opacity-70' : ''}`}
                  >
                    {canResume ? '↩ Resume' : '▶ Play'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
