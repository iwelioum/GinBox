/**
 * Manages episode navigation (next/previous) during series playback.
 * Handles source fetching, debrid unrestriction, autoplay countdown,
 * and keyboard shortcuts (N/P). The heavy lifting of fetching new
 * sources and loading them into MPV is done here to keep PlayerPage lean.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { endpoints } from '../../../api/client';
import { pickBestSource } from '../../../shared/utils/parsing';
import type { ContentType, Source, EpisodeVideo } from '../../../shared/types/index';
import type { StreamPreferences } from '../../../shared/stores/preferencesStore';

interface UseEpisodeNavigationOptions {
  contentType:  string;
  contentId:    string;
  episodes:     EpisodeVideo[];
  activeSeason: number | null;
  activeEpisode: number | null;
  position:     number;
  duration:     number;
  prefs:        StreamPreferences;
  play:         () => Promise<void>;
  pause:        () => Promise<void>;
  saveProgress: () => Promise<void>;
  onEpisodeChanged: (data: {
    sources: Source[];
    current: Source;
    season: number;
    episode: number;
    title: string;
    stillPath: string;
  }) => void;
}

interface UseEpisodeNavigationReturn {
  nextEpisodeData:    EpisodeVideo | null;
  prevEpisodeData:    EpisodeVideo | null;
  showNextEpisode:    boolean;
  switchingEpisode:   boolean;
  switchError:        string | null;
  autoplayCountdown:  number | null;
  cancelAutoplay:     () => void;
  handleNextEpisode:  () => Promise<void>;
  handlePrevEpisode:  () => Promise<void>;
}

/**
 * Drives series episode transitions: autoplay countdown, N/P keyboard shortcuts,
 * and the full fetch-unrestrict-load pipeline so PlayerPage stays declarative.
 */
export function useEpisodeNavigation({
  contentType,
  contentId,
  episodes,
  activeSeason,
  activeEpisode,
  position,
  duration,
  prefs,
  play,
  pause,
  saveProgress,
  onEpisodeChanged,
}: UseEpisodeNavigationOptions): UseEpisodeNavigationReturn {
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [switchingEpisode, setSwitchingEpisode] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);

  const normalizedEpisodes = useMemo(() => {
    return episodes
      .filter(v => (v.season ?? 0) > 0 && (v.episode ?? 0) > 0)
      .sort((a, b) => ((a.season ?? 0) - (b.season ?? 0)) || ((a.episode ?? 0) - (b.episode ?? 0)));
  }, [episodes]);

  const nextEpisodeData = useMemo(() => {
    if (!normalizedEpisodes.length || !activeSeason || !activeEpisode) return null;
    const idx = normalizedEpisodes.findIndex(
      ep => ep.season === activeSeason && ep.episode === activeEpisode,
    );
    if (idx < 0 || idx + 1 >= normalizedEpisodes.length) return null;
    return normalizedEpisodes[idx + 1];
  }, [normalizedEpisodes, activeSeason, activeEpisode]);

  const prevEpisodeData = useMemo(() => {
    if (!normalizedEpisodes.length || !activeSeason || !activeEpisode) return null;
    const idx = normalizedEpisodes.findIndex(
      ep => ep.season === activeSeason && ep.episode === activeEpisode,
    );
    if (idx <= 0) return null;
    return normalizedEpisodes[idx - 1];
  }, [normalizedEpisodes, activeSeason, activeEpisode]);

  /** Show "next episode" card when playback reaches 90% or last 12 seconds */
  useEffect(() => {
    if (!nextEpisodeData || duration <= 0 || switchingEpisode) {
      setShowNextEpisode(false);
      return;
    }
    const progressPct = (position / duration) * 100;
    const reachedEnd = progressPct >= 90 || position >= Math.max(0, duration - 12);
    if (reachedEnd && position > 0) {
      setShowNextEpisode(true);
      return;
    }
    if (progressPct < 80) {
      setShowNextEpisode(false);
    }
  }, [nextEpisodeData, duration, position, switchingEpisode]);

  /** Autoplay countdown (5 seconds) */
  useEffect(() => {
    if (!showNextEpisode || !prefs.autoPlay || !nextEpisodeData) {
      setAutoplayCountdown(null);
      return;
    }
    setAutoplayCountdown(5);
    const id = setInterval(() => {
      setAutoplayCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showNextEpisode, prefs.autoPlay, nextEpisodeData]);

  const switchEpisodeRef = useRef<(ep: EpisodeVideo) => Promise<void>>(async () => {});

  switchEpisodeRef.current = async (targetEpisode: EpisodeVideo) => {
    const targetSeason = targetEpisode.season ?? null;
    const targetEp = targetEpisode.episode ?? null;
    if (!targetSeason || !targetEp || !contentId) return;

    const backendType = contentType === 'tv' ? 'series' : contentType;
    if (backendType !== 'movie' && backendType !== 'series') return;

    setSwitchError(null);
    setShowNextEpisode(false);
    setSwitchingEpisode(true);

    try {
      await saveProgress();
      await pause();

      const { data: sourcePayload } = await endpoints.sources.get(
        backendType as ContentType,
        contentId,
        { season: targetSeason, episode: targetEp },
      );

      const sources: Source[] = Array.isArray(sourcePayload)
        ? sourcePayload
        : (sourcePayload.results ?? []);
      const best = pickBestSource(sources, prefs);

      if (!best || !best.magnet) {
        throw new Error('Aucune source valide pour cet episode.');
      }

      const { data } = await endpoints.debrid.unrestrict(best.magnet, best.cached_rd);
      await window.mpv?.command?.(['loadfile', data.stream_url, 'replace']);
      await play();

      onEpisodeChanged({
        sources,
        current: best,
        season: targetSeason,
        episode: targetEp,
        title: targetEpisode.title ?? '',
        stillPath: targetEpisode.still_path ?? '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSwitchError(`Impossible de lancer l'episode (${message}).`);
    } finally {
      setSwitchingEpisode(false);
    }
  };

  const handleNextEpisode = useCallback(async () => {
    if (!nextEpisodeData || switchingEpisode) return;
    await switchEpisodeRef.current(nextEpisodeData);
  }, [nextEpisodeData, switchingEpisode]);

  const handlePrevEpisode = useCallback(async () => {
    if (!prevEpisodeData || switchingEpisode) return;
    await switchEpisodeRef.current(prevEpisodeData);
  }, [prevEpisodeData, switchingEpisode]);

  /** Trigger next episode when autoplay countdown reaches 0 */
  useEffect(() => {
    if (autoplayCountdown === 0 && !switchingEpisode) {
      void handleNextEpisode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayCountdown]);

  /** Keyboard shortcuts: N = next, P = previous */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') { void handleNextEpisode(); }
      if (e.key === 'p' || e.key === 'P') { void handlePrevEpisode(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNextEpisode, handlePrevEpisode]);

  const cancelAutoplay = useCallback(() => setAutoplayCountdown(null), []);

  return {
    nextEpisodeData,
    prevEpisodeData,
    showNextEpisode,
    switchingEpisode,
    switchError,
    autoplayCountdown,
    cancelAutoplay,
    handleNextEpisode,
    handlePrevEpisode,
  };
}
