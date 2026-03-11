// useDetailPlayback.ts — playback, download and favorite handlers

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useAddToList, useRemoveFromList } from '@/shared/hooks/useLists';
import { useToast } from '@/shared/hooks/useToast';
import { pickBestSource } from '@/shared/utils/parsing';
import { extractErrorMessage } from '@/shared/utils/error';
import { endpoints } from '@/shared/api/client';
import { TMDB_IMAGE_BASE } from '@/shared/constants/tmdb';
import { usePlaybackStore } from '@/shared/stores/playbackStore';
import type { Source } from '@/shared/types/index';
import type { UseDetailDataResult } from './useDetailData';

export function useDetailPlayback(d: UseDetailDataResult) {
  const navigate = useNavigate();
  const prefs = usePreferencesStore();
  const addToList = useAddToList();
  const removeFromList = useRemoveFromList();
  const { toast } = useToast();
  const setNavigation = usePlaybackStore((s) => s.setNavigation);
  const [isPlayLoading, setIsPlayLoading] = React.useState(false);
  const [playError, setPlayError] = React.useState<string | null>(null);

  const buildPosterUrl = (): string =>
    d.item?.poster_path
      ? `${TMDB_IMAGE_BASE}w500${d.item.poster_path}`
      : (d.item?.poster ?? '');

  const buildRating = (): string =>
    d.item?.vote_average != null
      ? String(d.item.vote_average.toFixed(1))
      : '';

  const handleWatchEpisode = async (
    season: number,
    episode: number,
    resumeAt?: number,
  ): Promise<void> => {
    if (!d.id || !d.item || isPlayLoading) return;
    setIsPlayLoading(true);
    setPlayError(null);
    try {
      const { data: sp } = await endpoints.sources.get('series', d.id, { season, episode });
      const sources: Source[] = Array.isArray(sp) ? sp : (sp.results ?? []);
      const best = pickBestSource(sources, prefs);
      if (!best) { setPlayError('No source available for this episode.'); return; }
      if (!best.magnet) { setPlayError('Unable to launch this source.'); return; }
      const { data } = await endpoints.debrid.unrestrict(best.magnet, best.cached_rd);
      const resumeMs = resumeAt && resumeAt > 0 ? resumeAt : 0;
      const startAt = resumeMs > 0
        ? `&startAt=${encodeURIComponent(String(Math.floor(resumeMs / 1000)))}`
        : '';
      const episodeTitle = d.getEpisodeTitle(season, episode);
      const url =
        `/player?url=${encodeURIComponent(data.stream_url)}` +
        `&title=${encodeURIComponent(d.item.title || d.item.name || '')}` +
        `&poster=${encodeURIComponent(buildPosterUrl())}` +
        `&year=${encodeURIComponent(String(d.item.year ?? d.item.releaseInfo ?? ''))}` +
        `&rating=${encodeURIComponent(buildRating())}` +
        `&contentType=series&contentId=${encodeURIComponent(d.id)}` +
        `&season=${encodeURIComponent(String(season))}` +
        `&episode=${encodeURIComponent(String(episode))}` +
        (episodeTitle ? `&episodeTitle=${encodeURIComponent(episodeTitle)}` : '') +
        startAt +
        (d.detailPath ? `&returnTo=${encodeURIComponent(d.detailPath)}` : '');
      setNavigation({
        sources, current: best, mediaId: d.id, mediaType: 'series',
        season, episode, resumeAt: resumeMs,
        episodeTitle,
        selectedSeason: season, selectedEpisode: episode,
        episodes: d.episodeVideos.map(e => ({
          ...e,
          season: e.season, episode: e.episode,
          title: e.title, still_path: e.still_path,
        })),
        fromDetail: true, returnTo: d.detailPath ?? '',
      });
      navigate(url, { replace: true });
    } catch (err: unknown) {
      setPlayError(extractErrorMessage(err, 'Error launching playback'));
    } finally {
      setIsPlayLoading(false);
    }
  };

  const handlePlay = async (): Promise<void> => {
    if (!d.type || !d.id || !d.item || isPlayLoading) return;
    if (d.isSeries) {
      await handleWatchEpisode(
        d.selectedSeason, d.selectedEpisode,
        d.selectedEpisodeProgress?.positionMs,
      );
      return;
    }
    setIsPlayLoading(true);
    setPlayError(null);
    try {
      if (!d.sourceType) return;
      const { data: sp } = await endpoints.sources.get(d.sourceType, d.id);
      const sources: Source[] = Array.isArray(sp) ? sp : (sp.results ?? []);
      const best = pickBestSource(sources, prefs);
      if (!best) { setPlayError('No source available for this content.'); return; }
      if (!best.magnet) { setPlayError('Unable to launch this source.'); return; }
      const { data } = await endpoints.debrid.unrestrict(best.magnet, best.cached_rd);
      const url =
        `/player?url=${encodeURIComponent(data.stream_url)}` +
        `&title=${encodeURIComponent(d.item.title || d.item.name || '')}` +
        `&poster=${encodeURIComponent(buildPosterUrl())}` +
        `&year=${encodeURIComponent(String(d.item.year ?? d.item.releaseInfo ?? ''))}` +
        `&rating=${encodeURIComponent(buildRating())}` +
        `&contentType=${encodeURIComponent(d.sourceType)}` +
        `&contentId=${encodeURIComponent(d.id)}` +
        (d.detailPath ? `&returnTo=${encodeURIComponent(d.detailPath)}` : '');
      setNavigation({
        sources, current: best, mediaId: d.id,
        mediaType: d.sourceType ?? '', fromDetail: true, returnTo: d.detailPath ?? '',
      });
      navigate(url, { replace: true });
    } catch (err: unknown) {
      setPlayError(extractErrorMessage(err, 'Error launching playback'));
    } finally {
      setIsPlayLoading(false);
    }
  };

  const handleDownload = (): void => {
    if (!d.sourceType || !d.id) return;
    navigate(
      `/sources/${d.sourceType}/${d.id}?mode=download`,
      { replace: true, state: d.sourceNavState },
    );
  };

  const handleToggleFavorite = (): void => {
    if (!d.favoritesList || !d.item || !d.activeProfile) return;
    const ct = d.item.type || d.item.media_type || 'movie';
    const title = d.item.name || d.item.title || '';
    if (d.isFavorite) {
      removeFromList.mutate({ listId: d.favoritesList.id, contentId: d.item.id });
      toast(`${title} retiré de votre liste`, 'info', 2500);
    } else {
      addToList.mutate({
        listId: d.favoritesList.id, contentId: d.item.id, contentType: ct,
      });
      toast(`${title} ajouté à votre liste`, 'success', 2500);
    }
  };

  return {
    isPlayLoading, playError, setPlayError,
    isAddingToList: addToList.isPending || removeFromList.isPending,
    handlePlay, handleWatchEpisode, handleDownload, handleToggleFavorite,
  };
}
