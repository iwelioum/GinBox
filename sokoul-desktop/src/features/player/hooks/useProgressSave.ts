/**
 * Periodically saves playback position to the backend so the user
 * can resume where they left off. Uses a ref-based approach to
 * avoid stale closures in the save callback — position and duration
 * change every 250ms from the MPV polling interval.
 */

import { useRef, useEffect, useCallback } from 'react';
import { endpoints } from '../../../api/client';
import type { ContentType } from '../../../shared/types/index';

const SAVE_INTERVAL_MS = 10_000;

interface UseProgressSaveOptions {
  profileId:      number | null;
  contentId:      string;
  contentType:    string;
  season:         number | null;
  episode:        number | null;
  episodeTitle:   string;
  stillPath:      string;
  position:       number;
  duration:       number;
}

/**
 * Persists playback position to the Rust backend every 10s for resume-on-relaunch.
 * Uses refs to avoid stale closures since position updates at 250ms from MPV polling.
 */
export function useProgressSave(options: UseProgressSaveOptions) {
  const optsRef = useRef(options);
  optsRef.current = options;

  const saveProgress = useCallback(async () => {
    const {
      profileId, contentId, contentType,
      season, episode, episodeTitle, stillPath,
      position, duration,
    } = optsRef.current;

    const normalizedType = contentType === 'tv' ? 'series' : contentType;
    const positionMs = Math.floor(position * 1000);
    const durationMs = Math.floor(duration * 1000);

    if (!profileId || !contentId || positionMs <= 0 || durationMs <= 0) return;
    if (normalizedType !== 'movie' && normalizedType !== 'series') return;

    try {
      await endpoints.playback.savePosition({
        profile_id: profileId,
        content_id: contentId,
        content_type: normalizedType as ContentType,
        season,
        episode,
        position_ms: positionMs,
        duration_ms: durationMs,
        episode_title: episodeTitle || undefined,
        still_path: stillPath || undefined,
      });
    } catch (err) {
      console.warn('[Player] savePosition failed:', err);
    }
  }, []);

  /** Auto-save on a 10-second interval while content is loaded */
  useEffect(() => {
    if (!optsRef.current.profileId || !optsRef.current.contentId || !optsRef.current.contentType) return;
    const interval = setInterval(() => { void saveProgress(); }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [options.profileId, options.contentId, options.contentType, saveProgress]);

  return { saveProgress };
}
