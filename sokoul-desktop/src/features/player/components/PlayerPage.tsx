/**
 * Main MPV player page. Launches the native player process, manages its
 * lifecycle, and coordinates playback state. The overlay window (OverlayPage)
 * renders controls on top of this page via a BroadcastChannel bridge.
 *
 * This component owns the "source of truth" for which content/episode is
 * playing. Episode switching, progress saving, and overlay broadcasting
 * are delegated to extracted hooks.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMpv } from '../hooks/useMpv';
import { usePlayerBroadcast } from '../hooks/usePlayerBroadcast';
import { useProgressSave } from '../hooks/useProgressSave';
import { useEpisodeNavigation } from '../hooks/useEpisodeNavigation';
import { usePlayerLifecycle } from '../hooks/usePlayerLifecycle';
import { LoadingScreen } from './LoadingScreen';
import { VideoContainer } from './VideoContainer';
import {
  SwitchErrorBanner,
  LaunchErrorOverlay,
} from './EpisodeOverlay';
import { useProfileStore } from '@/stores/profileStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { usePlaybackStore } from '@/shared/stores/playbackStore';
import type { Source, EpisodeVideo } from '../../../shared/types/index';
import '@/styles/player.tokens.css';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();

  const launchSources  = usePlaybackStore(s => s.sources.length > 0 ? s.sources : []);
  const launchCurrent  = usePlaybackStore(s => s.current ?? null);
  const launchEpisodes = usePlaybackStore(s => s.episodes.length > 0 ? s.episodes : []);
  const pbSeason       = usePlaybackStore(s => s.season);
  const pbEpisode      = usePlaybackStore(s => s.episode);
  const pbResumeAt     = usePlaybackStore(s => s.resumeAt);
  const pbEpisodeTitle = usePlaybackStore(s => s.episodeTitle);

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
  const resumeAtRaw    = Number(pbResumeAt ?? 0);
  const stateResumeAt  = Number.isFinite(resumeAtRaw) && resumeAtRaw > 0 ? resumeAtRaw / 1000 : 0;
  const startAt        = queryStartAt > 0 ? queryStartAt : stateResumeAt;

  const initialSeason  = pbSeason  ?? querySeason  ?? null;
  const initialEpisode = pbEpisode ?? queryEpisode ?? null;

  const [activeSources,      setActiveSources]      = useState<Source[]>(launchSources);
  const [activeCurrent,      setActiveCurrent]      = useState<Source | null>(launchCurrent);
  const [activeSeason,       setActiveSeason]       = useState<number | null>(initialSeason);
  const [activeEpisode,      setActiveEpisode]      = useState<number | null>(initialEpisode);
  const [activeEpisodeTitle, setActiveEpisodeTitle]  = useState(pbEpisodeTitle ?? '');
  const [activeStillPath,    setActiveStillPath]     = useState(
    () => launchEpisodes.find(e => e.season === initialSeason && e.episode === initialEpisode)?.still_path ?? '',
  );

  const prefs = usePreferencesStore(s => ({
    preferredLanguage: s.preferredLanguage,
    minQuality: s.minQuality,
    preferCachedRD: s.preferCachedRD,
    autoPlay: s.autoPlay,
    uiLanguage: s.uiLanguage,
  }));
  const activeProfile = useProfileStore(s => s.activeProfile);
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

  // Build display title for MPV window
  const mediaTitle = (() => {
    if (contentType === 'series' || contentType === 'tv') {
      const s = String(activeSeason ?? 0).padStart(2, '0');
      const e = String(activeEpisode ?? 0).padStart(2, '0');
      const epTitle = activeEpisodeTitle ? ` — ${activeEpisodeTitle}` : '';
      return `${title} — S${s}E${e}${epTitle}`;
    }
    return title || undefined;
  })();

  const { isLoaded, launchError, goBack } = usePlayerLifecycle({
    url, mediaTitle, startAt, returnTo,
    launch, kill, waitUntilReady, seekTo, play, saveProgress,
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

  usePlayerBroadcast({
    title,
    year,
    rating,
    contentType,
    contentId,
    sources:           activeSources,
    current:           activeCurrent,
    season:            activeSeason ?? undefined,
    episode:           activeEpisode ?? undefined,
    episodeTitle:      activeEpisodeTitle || undefined,
    nextEpisode:       nextEpisodeData
      ? { season: nextEpisodeData.season ?? 0, episode: nextEpisodeData.episode ?? 0, title: nextEpisodeData.title }
      : null,
    prevEpisode:       prevEpisodeData
      ? { season: prevEpisodeData.season ?? 0, episode: prevEpisodeData.episode ?? 0, title: prevEpisodeData.title }
      : null,
    switchingEpisode,
    autoplayCountdown,
  });

  /** Command channel: overlay sends episode commands → player executes */
  useEffect(() => {
    const bc = new BroadcastChannel('player_commands');
    bc.onmessage = (e: MessageEvent<{ action: string }>) => {
      if (e.data.action === 'nextEpisode') void handleNextEpisode();
      if (e.data.action === 'prevEpisode') void handlePrevEpisode();
      if (e.data.action === 'cancelAutoplay') cancelAutoplay();
    };
    return () => bc.close();
  }, [handleNextEpisode, handlePrevEpisode, cancelAutoplay]);

  const handleTogglePlay = async () => {
    if (launchError) return;
    if (isPlaying) await pause();
    else           await play();
  };

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden bg-black">
      <LoadingScreen title={title} poster={poster} visible={!isLoaded && !launchError} />
      <VideoContainer onClick={handleTogglePlay} />

      {switchError && !launchError && <SwitchErrorBanner error={switchError} />}
      {launchError && <LaunchErrorOverlay error={launchError} onBack={() => { void goBack(); }} />}
    </div>
  );
}
