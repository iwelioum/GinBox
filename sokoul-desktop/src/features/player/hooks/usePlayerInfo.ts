/**
 * Receives content metadata from PlayerPage via BroadcastChannel.
 * The overlay window has no direct access to navigation state,
 * so PlayerPage broadcasts title, sources, episode info on the
 * 'player_info' channel whenever they change.
 */

import { useState, useEffect } from 'react';
import type { Source } from '../../../shared/types/index';

/**
 * Content metadata the overlay needs but cannot access directly
 * because it runs in a separate Electron BrowserWindow without navigation state.
 */
type EpisodeRef = { season: number; episode: number; title?: string };

export interface PlayerInfo {
  title:             string;
  year:              string;
  rating:            string;
  contentType:       string;
  contentId:         string;
  season?:           number;
  episode?:          number;
  episodeTitle?:     string;
  nextEpisode?:      EpisodeRef | null;
  prevEpisode?:      EpisodeRef | null;
  switchingEpisode?: boolean;
  autoplayCountdown?: number | null;
}

interface UsePlayerInfoReturn {
  playerInfo:    PlayerInfo;
  sources:       Source[];
  currentSource: Source | null;
  setSources:       (sources: Source[]) => void;
  setCurrentSource: (source: Source | null) => void;
}

/**
 * Listens on the 'player_info' BroadcastChannel for metadata from PlayerPage.
 * The overlay window has no router context, so this is the only way it receives content info.
 */
export function usePlayerInfo(): UsePlayerInfoReturn {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({
    title: '', year: '', rating: '', contentType: '', contentId: '',
  });
  const [sources, setSources] = useState<Source[]>([]);
  const [currentSource, setCurrentSource] = useState<Source | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel('player_info');
    bc.onmessage = (e: MessageEvent<PlayerInfo & { sources?: Source[]; current?: Source }>) => {
      const payload = e.data;
      setPlayerInfo({
        title:             payload.title,
        year:              payload.year,
        rating:            payload.rating,
        contentType:       payload.contentType,
        contentId:         payload.contentId,
        season:            payload.season,
        episode:           payload.episode,
        episodeTitle:      payload.episodeTitle,
        nextEpisode:       payload.nextEpisode,
        prevEpisode:       payload.prevEpisode,
        switchingEpisode:  payload.switchingEpisode,
        autoplayCountdown: payload.autoplayCountdown,
      });
      if (Array.isArray(payload.sources)) setSources(payload.sources);
      if (payload.current) setCurrentSource(payload.current);
    };
    return () => bc.close();
  }, []);

  return { playerInfo, sources, currentSource, setSources, setCurrentSource };
}
