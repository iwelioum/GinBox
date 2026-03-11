// DetailEpisodes.tsx — Netflix 2025 × Infuse × Apple TV episode picker
// Tabs interface with premium episode cards

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '@/shared/utils/time';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Film, Tv, Clapperboard } from 'lucide-react';
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
    <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-[var(--radius-card)] 
                    overflow-hidden bg-[var(--color-bg-elevated)] flex items-center justify-center">
      {stillUrl ? (
        <img
          src={stillUrl}
          className="w-full h-full object-cover"
          loading="lazy"
          alt={`Episode ${episode}`}
        />
      ) : (
        <span className="text-[var(--color-text-muted)] text-xs">E{episode}</span>
      )}
      {showBar && (
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-accent)]"
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
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<'episodes' | 'similar' | 'extras'>('episodes');

  const previewProgress = getEpisodeProgress(selectedEpisodeData?.season, selectedEpisodeData?.episode);
  const previewCanResume = !!previewProgress && !previewProgress.watched && (previewProgress.positionMs ?? 0) > 0;
  const previewStill = getImageUrl(selectedEpisodeData?.still_path, 'w780');

  return (
    <section className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-[var(--color-border)]">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('episodes')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'episodes'
                ? 'text-[var(--color-text-primary)] border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Episodes
          </button>
          <button
            onClick={() => setActiveTab('similar')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'similar'
                ? 'text-[var(--color-text-primary)] border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {t('detail.similar')}
          </button>
          <button
            onClick={() => setActiveTab('extras')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'extras'
                ? 'text-[var(--color-text-primary)] border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Extras
          </button>
        </nav>
      </div>

      {/* Episodes Tab Content */}
      {activeTab === 'episodes' && (
        <div className="space-y-6">
          {/* Selected episode preview */}
          {selectedEpisodeData && (
            <div className="rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
              <div className="relative w-full aspect-video bg-[var(--color-bg-overlay)]">
                {previewStill ? (
                  <img src={previewStill} className="w-full h-full object-cover" alt={selectedEpisodeData.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                    S{String(selectedEpisodeData.season).padStart(2, '0')}E{String(selectedEpisodeData.episode).padStart(2, '0')}
                  </div>
                )}
                {previewProgress && previewProgress.progressPct > 0 && !previewProgress.watched && (
                  <div className="absolute left-0 right-0 bottom-0 h-1 bg-[var(--color-border)]">
                    <div className="h-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, previewProgress.progressPct)}%` }} />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      S{String(selectedEpisodeData.season).padStart(2, '0')}E{String(selectedEpisodeData.episode).padStart(2, '0')}
                      {selectedEpisodeData.runtime ? ` · ${selectedEpisodeData.runtime} ${t('common.min')}` : ''}
                    </p>
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {selectedEpisodeData.title ?? `Episode ${selectedEpisodeData.episode}`}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onWatchEpisode(
                      selectedEpisodeData.season ?? selectedSeason,
                      selectedEpisodeData.episode ?? 1,
                      previewCanResume ? previewProgress?.positionMs : undefined,
                    )}
                    disabled={isPlayLoading}
                    className="flex-shrink-0 bg-[var(--color-accent)] text-white text-xs font-semibold
                               px-4 py-2 rounded-[var(--radius-card)] hover:bg-[var(--color-accent-hover)]
                               transition-all duration-200 disabled:opacity-70 disabled:cursor-default"
                  >
                    {previewCanResume ? t('detail.resumeButton') : t('detail.playButton')}
                  </button>
                </div>
                {selectedEpisodeData.overview && (
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {selectedEpisodeData.overview}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Season selector */}
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t('detail.seasonEpisode')}
            </h3>
            {selectedEpisodeData && (
              <span className="text-xs text-[var(--color-text-muted)]">
                S{String(selectedSeason).padStart(2, '0')}E{String(selectedEpisode).padStart(2, '0')}
              </span>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[var(--color-border)]">
            {seasons.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onSelectSeason(s);
                  const first = episodeVideos.find(v => v.season === s)?.episode ?? 1;
                  onSelectEpisode(first);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-[var(--radius-card)] text-sm font-medium 
                           transition-all duration-200 ${
                  selectedSeason === s
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]'
                }`}
              >
                {t('detail.seasonNumber', { number: s }).replace('{{number}}', s.toString())}
              </button>
            ))}
          </div>

          {/* Episode list */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)]">
            {episodesOfSeason.length === 0 && (
              <EmptyState
                icon={<Tv />}
                title={t('detail.noEpisodes', { defaultValue: 'No episodes available' })}
                description={t('detail.noEpisodesDesc', { defaultValue: 'This season doesn\'t have any episodes yet.' })}
              />
            )}
            {episodesOfSeason.map(ep => {
              const stillUrl = getImageUrl(ep.still_path, 'w300');
              const isSelected = selectedEpisode === ep.episode;
              const progress = getEpisodeProgress(ep.season, ep.episode);
              const canResume = !!progress && !progress.watched && (progress.positionMs ?? 0) > 0;
              
              return (
                <div
                  key={`${ep.season}-${ep.episode}`}
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
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-1 rounded-full 
                                         border border-green-400/20">
                          {t('detail.watched')}
                        </span>
                      )}
                      {canResume && (
                        <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full 
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
            })}
          </div>
        </div>
      )}

      {/* Similar Tab Content */}
      {activeTab === 'similar' && (
        <EmptyState
          icon={<Film />}
          title={t('detail.similarComingSoon', { defaultValue: 'Similar content' })}
          description={t('detail.similarComingSoonDesc', { defaultValue: 'Recommendations based on this title are coming soon.' })}
        />
      )}

      {/* Extras Tab Content */}
      {activeTab === 'extras' && (
        <EmptyState
          icon={<Clapperboard />}
          title={t('detail.extrasComingSoon', { defaultValue: 'Extras' })}
          description={t('detail.extrasComingSoonDesc', { defaultValue: 'Behind-the-scenes content, deleted scenes and more coming soon.' })}
        />
      )}
    </section>
  );
};
