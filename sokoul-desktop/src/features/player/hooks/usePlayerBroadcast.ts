/**
 * Broadcasts current playback metadata (title, sources, episode info)
 * to the overlay window via BroadcastChannel. The overlay uses this to
 * display the content header and source panel. A 500ms replay ensures
 * the overlay receives the data even if it mounts slightly after the player.
 */

import { useEffect } from 'react';
import type { Source } from '../../../shared/types/index';

interface BroadcastPayload {
  title:        string;
  year:         string;
  rating:       string;
  contentType:  string;
  contentId:    string;
  sources:      Source[];
  current:      Source | null;
  season?:      number;
  episode?:     number;
  episodeTitle?: string;
}

/**
 * Pushes player metadata to the overlay BrowserWindow via BroadcastChannel.
 * Replays after 500ms to handle the race where the overlay mounts after the initial post.
 */
export function usePlayerBroadcast(payload: BroadcastPayload) {
  useEffect(() => {
    const bc = new BroadcastChannel('player_info');
    bc.postMessage(payload);

    /** Replay after 500ms so the overlay gets data even if it mounts late */
    const replayTimer = setTimeout(() => bc.postMessage(payload), 500);

    return () => {
      clearTimeout(replayTimer);
      bc.close();
    };
  }, [
    payload.title,
    payload.year,
    payload.rating,
    payload.contentType,
    payload.contentId,
    payload.sources,
    payload.current,
    payload.season,
    payload.episode,
    payload.episodeTitle,
  ]);
}
