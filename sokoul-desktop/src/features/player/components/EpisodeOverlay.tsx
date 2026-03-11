/**
 * Episode navigation overlay cards displayed on the player page.
 * Shows previous/next episode buttons with autoplay countdown,
 * episode switching errors, and fatal launch errors.
 */

import { useTranslation } from 'react-i18next';
import type { EpisodeVideo } from '../../../shared/types/index';

interface PrevEpisodeCardProps {
  episode:          EpisodeVideo;
  switchingEpisode: boolean;
  onSwitch:         () => void;
}

export function PrevEpisodeCard({ episode, switchingEpisode, onSwitch }: PrevEpisodeCardProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute left-6 bottom-[84px] z-20 flex items-center gap-3 rounded-xl border border-white/[0.14] bg-black/[0.72] p-3.5 backdrop-blur-md">
      <button
        onClick={onSwitch}
        disabled={switchingEpisode}
        className={`rounded-lg border-none px-3.5 py-2 text-sm font-bold text-black ${
          switchingEpisode ? 'cursor-default bg-white/35 opacity-75' : 'cursor-pointer bg-white'
        }`}
      >
        {switchingEpisode ? t('player.loadingEpisode') : t('player.previousButton')}
      </button>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs uppercase tracking-wider text-white/45">
          {t('player.previousEpisode')}
        </span>
        <span className="text-sm font-semibold text-white">
          S{String(episode.season ?? '').padStart(2, '0')}E{String(episode.episode ?? '').padStart(2, '0')}
          {episode.title ? ` — ${episode.title}` : ''}
        </span>
      </div>
    </div>
  );
}

interface NextEpisodeCardProps {
  episode:            EpisodeVideo;
  switchingEpisode:   boolean;
  autoplayCountdown:  number | null;
  onSwitch:           () => void;
  onCancelAutoplay:   () => void;
}

export function NextEpisodeCard({
  episode,
  switchingEpisode,
  autoplayCountdown,
  onSwitch,
  onCancelAutoplay,
}: NextEpisodeCardProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute right-6 bottom-[84px] z-20 flex items-center gap-3 rounded-xl border border-white/[0.14] bg-black/[0.72] p-3.5 backdrop-blur-md">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs uppercase tracking-wider text-white/45">
          {autoplayCountdown !== null ? t('player.playingIn', { count: autoplayCountdown }) : t('player.nextEpisode')}
        </span>
        <span className="text-sm font-semibold text-white">
          S{String(episode.season ?? '').padStart(2, '0')}E{String(episode.episode ?? '').padStart(2, '0')}
          {episode.title ? ` — ${episode.title}` : ''}
        </span>
      </div>
      {autoplayCountdown !== null && !switchingEpisode && (
        <button
          onClick={onCancelAutoplay}
          className="cursor-pointer rounded-lg border border-white/30 bg-transparent px-3.5 py-2 text-sm font-semibold text-white"
        >
          {t('common.cancel')}
        </button>
      )}
      <button
        onClick={onSwitch}
        disabled={switchingEpisode}
        className={`rounded-lg border-none px-3.5 py-2 text-sm font-bold text-black ${
          switchingEpisode ? 'cursor-default bg-white/35 opacity-75' : 'cursor-pointer bg-white'
        }`}
      >
        {switchingEpisode ? t('player.loadingEpisode') : t('player.nextButton')}
      </button>
    </div>
  );
}

interface SwitchErrorBannerProps {
  error: string;
}

export function SwitchErrorBanner({ error }: SwitchErrorBannerProps) {
  return (
    <div className="absolute right-6 bottom-6 z-20 max-w-[520px] rounded-lg border border-red-400/45 bg-red-900/[0.88] px-3 py-2.5 text-xs text-white">
      {error}
    </div>
  );
}

interface LaunchErrorOverlayProps {
  error:  string;
  onBack: () => void;
}

export function LaunchErrorOverlay({ error, onBack }: LaunchErrorOverlayProps) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/[0.72] p-6 text-center text-white">
      <p className="m-0 max-w-[680px]">{error}</p>
      <button
        onClick={onBack}
        className="cursor-pointer rounded-md border border-white/35 bg-white/[0.12] px-4 py-2.5 font-semibold text-white"
      >
        {t('player.back')}
      </button>
    </div>
  );
}
