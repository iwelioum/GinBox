/**
 * Main MPV player page. Launches the native player process, manages its
 * lifecycle, and coordinates playback state. The overlay window (OverlayPage)
 * renders controls on top of this page via a BroadcastChannel bridge.
 *
 * This component owns the "source of truth" for which content/episode is
 * playing. Episode switching, progress saving, and overlay broadcasting
 * are delegated to extracted hooks.
 */

import { useState, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMpv } from '../hooks/useMpv';
import { usePlayerBroadcast } from '../hooks/usePlayerBroadcast';
import { useProgressSave } from '../hooks/useProgressSave';
import { useEpisodeNavigation } from '../hooks/useEpisodeNavigation';
import { usePlayerLifecycle } from '../hooks/usePlayerLifecycle';
import { LoadingScreen } from './LoadingScreen';
import { VideoContainer } from './VideoContainer';
import {
  PrevEpisodeCard,
  NextEpisodeCard,
  SwitchErrorBanner,
  LaunchErrorOverlay,
} from './EpisodeOverlay';
import { useProfileStore } from '@/stores/profileStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import type { Source, EpisodeVideo } from '../../../shared/types/index';
import '@/styles/player.tokens.css';

interface PlayerNavigationState {
  sources?:      Source[];
  current?:      Source;
  mediaId?:      string;
  mediaType?:    string;
  season?:       number;
  episode?:      number;
  resumeAt?:     number;
  episodeTitle?: string;
  episodes?:     EpisodeVideo[];
}

export default function PlayerPage() {
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const navigationState = (location.state as PlayerNavigationState | null) ?? null;
  const launchSources  = Array.isArray(navigationState?.sources)  ? navigationState.sources  : [];
  const launchCurrent  = navigationState?.current ?? null;
  const launchEpisodes = Array.isArray(navigationState?.episodes) ? navigationState.episodes : [];

  const url         = searchParams.get('url')         ?? '';
  const title       = searchParams.get('title')       ?? '';
  const poster      = searchParams.get('poster')      ?? '';
  const year        = searchParams.get('year')        ?? '';
  const rating      = searchParams.get('rating')      ?? '';
  const contentType = searchParams.get('contentType') ?? '';
  const contentId   = searchParams.get('contentId')   ?? '';
  const returnTo    = searchParams.get('returnTo')    ?? '';

  const seasonRaw    = Number(searchParams.get('season')  ?? '');
  const episodeRaw   = Number(searchParams.get('episode') ?? '');
  const querySeason  = Number.isFinite(seasonRaw)  && seasonRaw  > 0 ? seasonRaw  : undefined;
  const queryEpisode = Number.isFinite(episodeRaw) && episodeRaw > 0 ? episodeRaw : undefined;

  const startAtRaw     = Number(searchParams.get('startAt') ?? '0');
  const queryStartAt   = Number.isFinite(startAtRaw) && startAtRaw > 0 ? startAtRaw : 0;
  const resumeAtRaw    = Number(navigationState?.resumeAt ?? 0);
  const stateResumeAt  = Number.isFinite(resumeAtRaw) && resumeAtRaw > 0 ? resumeAtRaw / 1000 : 0;
  const startAt        = queryStartAt > 0 ? queryStartAt : stateResumeAt;

  const initialSeason  = navigationState?.season  ?? querySeason  ?? null;
  const initialEpisode = navigationState?.episode ?? queryEpisode ?? null;

  const [activeSources,      setActiveSources]      = useState<Source[]>(launchSources);
  const [activeCurrent,      setActiveCurrent]      = useState<Source | null>(launchCurrent);
  const [activeSeason,       setActiveSeason]       = useState<number | null>(initialSeason);
  const [activeEpisode,      setActiveEpisode]      = useState<number | null>(initialEpisode);
  const [activeEpisodeTitle, setActiveEpisodeTitle]  = useState(navigationState?.episodeTitle ?? '');
  const [activeStillPath,    setActiveStillPath]     = useState(
    () => launchEpisodes.find(e => e.season === initialSeason && e.episode === initialEpisode)?.still_path ?? '',
  );

  const prefs = usePreferencesStore();
  const { activeProfile } = useProfileStore();
  const { launch, kill, waitUntilReady, play, pause, seekTo, isPlaying, position, duration } = useMpv();

  const { saveProgress } = useProgressSave({
    profileId:    activeProfile?.id ?? null,
    contentId,
    contentType,
    season:       activeSeason,
    episode:      activeEpisode,
    episodeTitle: activeEpisodeTitle,
    stillPath:    activeStillPath,
    position,
    duration,
  });

  const { isLoaded, launchError, goBack } = usePlayerLifecycle({
    url, startAt, returnTo,
    launch, kill, waitUntilReady, seekTo, play, saveProgress,
  });

  usePlayerBroadcast({
    title,
    year,
    rating,
    contentType,
    contentId,
    sources:      activeSources,
    current:      activeCurrent,
    season:       activeSeason ?? undefined,
    episode:      activeEpisode ?? undefined,
    episodeTitle: activeEpisodeTitle || undefined,
  });

  const onEpisodeChanged = useCallback((data: {
    sources: Source[];
    current: Source;
    season: number;
    episode: number;
    title: string;
    stillPath: string;
  }) => {
    setActiveSources(data.sources);
    setActiveCurrent(data.current);
    setActiveSeason(data.season);
    setActiveEpisode(data.episode);
    setActiveEpisodeTitle(data.title);
    setActiveStillPath(data.stillPath);
  }, []);

  const {
    nextEpisodeData,
    prevEpisodeData,
    showNextEpisode,
    switchingEpisode,
    switchError,
    autoplayCountdown,
    cancelAutoplay,
    handleNextEpisode,
    handlePrevEpisode,
  } = useEpisodeNavigation({
    contentType,
    contentId,
    episodes:      launchEpisodes,
    activeSeason,
    activeEpisode,
    position,
    duration,
    prefs,
    play,
    pause,
    saveProgress,
    onEpisodeChanged,
  });

  const handleTogglePlay = async () => {
    if (launchError) return;
    if (isPlaying) await pause();
    else           await play();
  };

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden bg-black">
      <LoadingScreen title={title} poster={poster} visible={!isLoaded && !launchError} />
      <VideoContainer onClick={handleTogglePlay} />

      {prevEpisodeData && !launchError && (
        <PrevEpisodeCard
          episode={prevEpisodeData}
          switchingEpisode={switchingEpisode}
          onSwitch={() => { void handlePrevEpisode(); }}
        />
      )}

      {showNextEpisode && nextEpisodeData && !launchError && (
        <NextEpisodeCard
          episode={nextEpisodeData}
          switchingEpisode={switchingEpisode}
          autoplayCountdown={autoplayCountdown}
          onSwitch={() => { void handleNextEpisode(); }}
          onCancelAutoplay={cancelAutoplay}
        />
      )}

      {switchError && !launchError && <SwitchErrorBanner error={switchError} />}
      {launchError && <LaunchErrorOverlay error={launchError} onBack={() => { void goBack(); }} />}
    </div>
  );
}
