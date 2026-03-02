/**
 * Main MPV player page. Launches the native player process, manages its
 * lifecycle, and coordinates playback state. The overlay window (OverlayPage)
 * renders controls on top of this page via a BroadcastChannel bridge.
 *
 * This component owns the "source of truth" for which content/episode is
 * playing. Episode switching, progress saving, and overlay broadcasting
 * are delegated to extracted hooks.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMpv } from '../hooks/useMpv';
import { usePlayerBroadcast } from '../hooks/usePlayerBroadcast';
import { useProgressSave } from '../hooks/useProgressSave';
import { useEpisodeNavigation } from '../hooks/useEpisodeNavigation';
import { LoadingScreen } from './LoadingScreen';
import { VideoContainer } from './VideoContainer';
import {
  PrevEpisodeCard,
  NextEpisodeCard,
  SwitchErrorBanner,
  LaunchErrorOverlay,
} from './EpisodeOverlay';
import { useProfileStore } from '../../../shared/stores/profileStore';
import { usePreferencesStore } from '../../../shared/stores/preferencesStore';
import type { Source, EpisodeVideo } from '../../../shared/types/index';
import '../styles/player.tokens.css';

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
  const navigate       = useNavigate();
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
  const [isLoaded,    setIsLoaded]    = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const prefs = usePreferencesStore();
  const { activeProfile } = useProfileStore();
  const { launch, kill, waitUntilReady, play, pause, seekTo, isPlaying, position, duration } = useMpv();

  /**
   * Refs prevent stale closures in IPC and effect callbacks that
   * capture values at mount time but need current values at call time.
   */
  const navigateRef  = useRef(navigate);
  const killRef      = useRef(kill);
  const waitReadyRef = useRef(waitUntilReady);
  const seekToRef    = useRef(seekTo);
  const returnToRef  = useRef(returnTo);
  const killedRef    = useRef(false);
  const launched     = useRef(false);

  navigateRef.current  = navigate;
  killRef.current      = kill;
  waitReadyRef.current = waitUntilReady;
  seekToRef.current    = seekTo;
  returnToRef.current  = returnTo;

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

  /** Broadcast playback metadata to the overlay window */
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

  /** Navigate back: save progress, kill MPV, return to origin */
  const goBack = useRef(async () => {
    if (killedRef.current) return;
    killedRef.current = true;
    try {
      await saveProgress();
      await killRef.current();
    } finally {
      const target = returnToRef.current;
      if (target) navigateRef.current(target, { replace: true });
      else        navigateRef.current(-1);
    }
  });

  /** Launch MPV on mount, kill on unmount */
  useEffect(() => {
    if (!url) {
      if (returnToRef.current) navigateRef.current(returnToRef.current, { replace: true });
      else                     navigateRef.current(-1);
      return;
    }
    if (launched.current) return;
    launched.current = true;

    const start = async () => {
      setLaunchError(null);
      try {
        await launch(url);
        const ready = await waitReadyRef.current(24, 150);
        if (!ready) throw new Error('pipe MPV indisponible');
        if (startAt > 0) await seekToRef.current(startAt);
        await play();
        setIsLoaded(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLaunchError(`Impossible de demarrer la lecture (${message}).`);
        setIsLoaded(false);
        await killRef.current();
      }
    };

    void start();

    return () => {
      launched.current = false;
      if (!killedRef.current) {
        void saveProgress();
        void killRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Listen for overlay "back" signal via IPC */
  useEffect(() => {
    const unsub = window.mpv?.onBack?.(() => { void goBack.current(); });
    return () => { unsub?.(); };
  }, []);

  /** Escape key triggers back navigation */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { void goBack.current(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {launchError && <LaunchErrorOverlay error={launchError} onBack={() => { void goBack.current(); }} />}
    </div>
  );
}
