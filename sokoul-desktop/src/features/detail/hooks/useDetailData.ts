// useDetailData.ts — core data-fetching hook for the detail page
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resolveTheme } from '@/shared/utils/genreTheme';
import { useDynamicAccentColor } from '@/shared/hooks/useDynamicAccentColor';
import { useDetailQuery } from './useDetailQuery';
import { useCreditsQuery } from './useCreditsQuery';
import { useImagesQuery } from './useImagesQuery';
import { useVideosQuery } from './useVideosQuery';
import { useSimilarQuery } from './useSimilarQuery';
import { useCollectionQuery } from '@/shared/hooks/useCollectionQuery';
import { useProfileStore } from '@/stores/profileStore';
import { getLogo, type FanartResponse } from '@/shared/utils/fanart';
import { useLists, useListItems } from '@/shared/hooks/useLists';
import { endpoints } from '@/shared/api/client';
import type { ContentType, PlaybackEntry } from '@/shared/types/index';

const VALID_TYPES = new Set<string>(['movie', 'series', 'tv']);
const PLAYBACK_HISTORY_LIMIT = 200;

export function useDetailData() {
  const { type, id } = useParams<{ type: ContentType; id: string }>();
  const { activeProfile } = useProfileStore();
  const isValidType = !!type && VALID_TYPES.has(type);
  const isSeries = type === 'series' || type === 'tv';
  const sourceType: ContentType | undefined = type === 'tv' ? 'series' : type;
  const [selectedSeason, setSelectedSeason] = React.useState(1);
  const [selectedEpisode, setSelectedEpisode] = React.useState(1);

  const { data: item, isLoading: metaLoading, error: metaError } = useDetailQuery(type!, id!);
  const { data: credits, isLoading: creditsLoading } = useCreditsQuery(type!, id!);
  const { data: images } = useImagesQuery(type!, id!);
  const { data: videos } = useVideosQuery(type!, id!);
  const { data: similar } = useSimilarQuery(type!, id!);
  const { data: collection } = useCollectionQuery(item?.belongs_to_collection?.id);

  const episodeVideos = React.useMemo(() =>
    (item?.episodes ?? [])
      .filter(v => (v.season ?? 0) > 0 && (v.episode ?? 0) > 0)
      .sort((a, b) => ((a.season ?? 0) - (b.season ?? 0)) || ((a.episode ?? 0) - (b.episode ?? 0))),
    [item?.episodes],
  );

  const seasons = React.useMemo(
    () => [...new Set(episodeVideos.map(v => v.season as number))].sort((a, b) => a - b),
    [episodeVideos],
  );

  const episodesOfSeason = React.useMemo(
    () => episodeVideos
      .filter(v => v.season === selectedSeason)
      .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0)),
    [episodeVideos, selectedSeason],
  );

  const selectedEpisodeData = React.useMemo(
    () => episodesOfSeason.find(v => v.episode === selectedEpisode),
    [episodesOfSeason, selectedEpisode],
  );

  // Playback history — limit reduced from 1200 to avoid over-fetching
  const { data: playbackHistory = [], isFetched: historyFetched } = useQuery<PlaybackEntry[]>({
    queryKey: ['playback-history', activeProfile?.id, id],
    queryFn: async () => {
      if (!activeProfile?.id || !id) return [];
      const { data } = await endpoints.playback.history(activeProfile.id, PLAYBACK_HISTORY_LIMIT);
      return data.filter(
        e => e.contentId === id && (e.contentType === 'series' || e.contentType === 'tv'),
      );
    },
    enabled: isSeries && !!activeProfile?.id && !!id, staleTime: 30_000,
  });

  const episodeProgressMap = React.useMemo(() => {
    const map = new Map<string, PlaybackEntry>();
    for (const entry of playbackHistory) {
      if ((entry.season ?? 0) <= 0 || (entry.episode ?? 0) <= 0) continue;
      map.set(`${entry.season}-${entry.episode}`, entry);
    }
    return map;
  }, [playbackHistory]);

  const getEpisodeProgress = React.useCallback((season?: number, episode?: number) => {
    if ((season ?? 0) <= 0 || (episode ?? 0) <= 0) return undefined;
    return episodeProgressMap.get(`${season}-${episode}`);
  }, [episodeProgressMap]);

  const selectedEpisodeProgress = React.useMemo(
    () => getEpisodeProgress(selectedSeason, selectedEpisode),
    [getEpisodeProgress, selectedSeason, selectedEpisode],
  );

  const lastProgressEpisode = React.useMemo(() => {
    let latest: PlaybackEntry | null = null;
    for (const entry of playbackHistory) {
      if ((entry.season ?? 0) <= 0 || (entry.episode ?? 0) <= 0) continue;
      if (!latest || entry.updatedAt > latest.updatedAt) latest = entry;
    }
    return latest;
  }, [playbackHistory]);

  // Bug fix: use full `lastProgressEpisode` object as dependency, not individual properties
  React.useEffect(() => {
    if (!isSeries || !historyFetched || !lastProgressEpisode) return;
    if ((lastProgressEpisode.season ?? 0) <= 0 || (lastProgressEpisode.episode ?? 0) <= 0) return;
    setSelectedSeason(lastProgressEpisode.season ?? 1);
    setSelectedEpisode(lastProgressEpisode.episode ?? 1);
  }, [isSeries, historyFetched, lastProgressEpisode]);

  React.useEffect(() => {
    if (!isSeries || seasons.length === 0) return;
    setSelectedSeason(c => (seasons.includes(c) ? c : seasons[0]));
  }, [isSeries, seasons]);

  React.useEffect(() => {
    if (!isSeries || episodesOfSeason.length === 0) return;
    setSelectedEpisode(c => {
      if (episodesOfSeason.some(v => v.episode === c)) return c;
      return episodesOfSeason[0].episode ?? 1;
    });
  }, [isSeries, episodesOfSeason]);

  const { data: fanart } = useQuery<FanartResponse | null>({
    queryKey: ['fanart', type, id],
    queryFn: async (): Promise<FanartResponse | null> => {
      if (!id || !type) return null;
      const tmdbId = id.split(':')[1] || id;
      const ft = type === 'movie' ? 'movie' : 'tv';
      try { return (await endpoints.fanart.get(ft, tmdbId)).data as FanartResponse; }
      catch { return null; }
    },
    enabled: !!id && !!type,
    staleTime: Infinity,
  });

  const genreNames: string[] = (item?.genres ?? []).map(g =>
    typeof g === 'string' ? g : (g as { name: string }).name);
  const theme = resolveTheme(genreNames);
  useDynamicAccentColor((item?.poster_path || item?.poster) ?? null);
  const logoUrl = getLogo(fanart, type === 'movie' ? 'movie' : 'tv') || images?.logos?.[0] || null;

  const { data: lists = [] } = useLists();
  const favoritesList = lists.find(l => l.listType === 'favorites' || l.name?.toLowerCase() === 'ma liste');
  const { data: favItems = [] } = useListItems(favoritesList?.id ?? null);
  const isFavorite = favItems.some(fav => fav.contentId === id);
  const detailPath = type && id ? `/detail/${type}/${id}` : '';
  const sourceNavState = detailPath ? { fromDetail: true, returnTo: detailPath } : undefined;
  const getEpisodeTitle = React.useCallback(
    (s: number, e: number) => episodeVideos.find(v => v.season === s && v.episode === e)?.title,
    [episodeVideos]);

  return {
    type, id, activeProfile, isValidType, isSeries, sourceType,
    item, metaLoading, metaError, credits, creditsLoading,
    images, videos, similar, collection,
    episodeVideos, seasons, episodesOfSeason, selectedEpisodeData,
    selectedSeason, setSelectedSeason, selectedEpisode, setSelectedEpisode,
    getEpisodeProgress, selectedEpisodeProgress,
    theme, logoUrl, isFavorite, favoritesList,
    detailPath, sourceNavState, getEpisodeTitle,
  };
}

export type UseDetailDataResult = ReturnType<typeof useDetailData>;
