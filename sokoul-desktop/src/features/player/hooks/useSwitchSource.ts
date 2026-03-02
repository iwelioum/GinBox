/**
 * Handles switching the active playback source and refreshing
 * the source list from the backend. Communicates with MPV via
 * IPC to pause, load the new stream URL, and resume playback.
 * The debrid unrestrict step converts a torrent magnet into
 * a direct stream URL usable by MPV.
 */

import { useState, useCallback, useMemo } from 'react';
import { endpoints } from '../../../api/client';
import type { ContentType, Source } from '../../../shared/types/index';
import type { PlayerInfo } from './usePlayerInfo';

const QUALITY_ORDER = ['4K', '2160p', '1080p', '720p', '480p'];

interface UseSwitchSourceOptions {
  playerInfo:       PlayerInfo;
  sources:          Source[];
  currentSource:    Source | null;
  setSources:       (sources: Source[]) => void;
  setCurrentSource: (source: Source | null) => void;
}

interface UseSwitchSourceReturn {
  switchingSource:    boolean;
  refreshingSources:  boolean;
  switchError:        string | null;
  groupedSources:     [string, Source[]][];
  isCurrent:          (source: Source) => boolean;
  handleSwitchSource:   (source: Source) => Promise<void>;
  handleRefreshSources: () => Promise<void>;
  clearSwitchError:     () => void;
}

/**
 * Orchestrates mid-playback source switching: pauses MPV, unrestricts the new torrent
 * via Real-Debrid to get a direct stream URL, then hot-replaces the file in MPV.
 */
export function useSwitchSource({
  playerInfo,
  sources,
  currentSource,
  setSources,
  setCurrentSource,
}: UseSwitchSourceOptions): UseSwitchSourceReturn {
  const [switchingSource, setSwitchingSource] = useState(false);
  const [refreshingSources, setRefreshingSources] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const groupedSources = useMemo(() => {
    const groups: Record<string, Source[]> = {};
    for (const source of sources) {
      const key = source.quality ?? 'Autre';
      if (!groups[key]) groups[key] = [];
      groups[key].push(source);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      const ia = QUALITY_ORDER.findIndex(q => a.includes(q));
      const ib = QUALITY_ORDER.findIndex(q => b.includes(q));
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [sources]);

  const isCurrent = useCallback((source: Source): boolean => {
    if (!currentSource) return false;
    if (source.info_hash && currentSource.info_hash) {
      return source.info_hash === currentSource.info_hash;
    }
    return source.title === currentSource.title;
  }, [currentSource]);

  const handleRefreshSources = useCallback(async () => {
    if (refreshingSources || switchingSource) return;
    if (!playerInfo.contentId) {
      setSwitchError('Impossible d\u2019actualiser: contenu inconnu.');
      return;
    }

    const normalizedType = playerInfo.contentType === 'tv' ? 'series' : playerInfo.contentType;
    if (normalizedType !== 'movie' && normalizedType !== 'series') {
      setSwitchError('Type de contenu invalide pour actualiser les sources.');
      return;
    }

    setRefreshingSources(true);
    setSwitchError(null);
    try {
      const params: Record<string, string | number | boolean> = { force: true };
      if (normalizedType === 'series') {
        if (playerInfo.season) params.season = playerInfo.season;
        if (playerInfo.episode) params.episode = playerInfo.episode;
      }

      const { data } = await endpoints.sources.get(
        normalizedType as ContentType,
        playerInfo.contentId,
        params,
      );
      const refreshed: Source[] = Array.isArray(data) ? data : (data.results ?? []);
      setSources(refreshed);

      if (currentSource) {
        const refreshedCurrent = refreshed.find((source: Source) => {
          if (currentSource.info_hash && source.info_hash) {
            return currentSource.info_hash === source.info_hash;
          }
          return currentSource.title === source.title;
        });
        if (refreshedCurrent) setCurrentSource(refreshedCurrent);
      }

      if (refreshed.length === 0) {
        setSwitchError('Aucune source trouvee apres actualisation.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSwitchError(axiosErr?.response?.data?.error ?? axiosErr?.message ?? 'Actualisation des sources impossible');
    } finally {
      setRefreshingSources(false);
    }
  }, [currentSource, playerInfo, refreshingSources, switchingSource, setSources, setCurrentSource]);

  const handleSwitchSource = useCallback(async (source: Source) => {
    if (switchingSource) return;
    if (!source.magnet) {
      setSwitchError('Source invalide: lien indisponible.');
      return;
    }

    setSwitchError(null);
    setSwitchingSource(true);

    try {
      await window.mpv?.command({ command: ['set_property', 'pause', true] });
      const { data } = await endpoints.debrid.unrestrict(source.magnet, source.cached_rd);
      await window.mpv?.command({ command: ['loadfile', data.stream_url, 'replace'] });
      await window.mpv?.command({ command: ['set_property', 'pause', false] });
      setCurrentSource(source);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSwitchError(axiosErr?.response?.data?.error ?? axiosErr?.message ?? 'Impossible de charger cette source');
    } finally {
      setSwitchingSource(false);
    }
  }, [switchingSource, setCurrentSource]);

  const clearSwitchError = useCallback(() => setSwitchError(null), []);

  return {
    switchingSource,
    refreshingSources,
    switchError,
    groupedSources,
    isCurrent,
    handleSwitchSource,
    handleRefreshSources,
    clearSwitchError,
  };
}
