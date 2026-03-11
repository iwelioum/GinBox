// useHomePersonalized.ts — Data hooks for personalized HomePage rails
// Extracted from HomePage.tsx to keep it under 300 lines

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/profileStore';
import { useKidsFilter } from '@/shared/hooks/useKidsFilter';
import { endpoints } from '@/shared/api/client';
import type { CatalogMeta, PlaybackEntry, ListItem, UserList } from '@/shared/types';

interface PersonalizedRails {
  continueWatchingItems: CatalogMeta[];
  recentlyAddedItems: CatalogMeta[];
  becauseYouWatched: { title: string; items: CatalogMeta[] };
}

export function useHomePersonalized(
  catalog: Record<string, CatalogMeta[]> | null,
  sections: Record<string, CatalogMeta[]>,
): PersonalizedRails {
  const { t } = useTranslation();
  const profileId = useProfileStore((s) => s.activeProfile?.id ?? null);
  const { filterForKids } = useKidsFilter<CatalogMeta>();

  // Fetch playback history for "Continue Watching" rail
  const { data: playbackHistory } = useQuery({
    queryKey: ['playback-history', profileId],
    queryFn: () => endpoints.playback.history(profileId!, 30).then(r => r.data),
    enabled: profileId !== null,
    staleTime: 30_000,
  });

  // Fetch user's lists to find the favorites/default list
  const { data: userLists } = useQuery<UserList[]>({
    queryKey: ['lists', profileId],
    queryFn: () => endpoints.lists.list(profileId!).then(r => r.data),
    enabled: profileId !== null,
    staleTime: 60_000,
  });
  const favListId = userLists?.find(l => l.isDefault)?.id ?? null;

  // Fetch items from the favorites list
  const { data: favItems } = useQuery<ListItem[]>({
    queryKey: ['list-items', favListId],
    queryFn: () => endpoints.lists.getItems(favListId!).then(r => r.data),
    enabled: favListId !== null,
    staleTime: 60_000,
  });

  // "Recently Added to My List"
  const recentlyAddedItems = React.useMemo(() => {
    if (!favItems || favItems.length === 0) return [];
    return [...favItems]
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, 20)
      .map((li): CatalogMeta => ({
        id: li.contentId,
        type: li.contentType,
        name: li.title,
        poster: li.posterUrl,
        poster_path: li.posterUrl,
      }));
  }, [favItems]);

  // "Continue Watching"
  const continueWatchingItems = React.useMemo(() => {
    if (!playbackHistory || !catalog) return [];
    const allItems = Object.values(sections).flat();
    const itemMap = new Map<string, CatalogMeta>();
    for (const item of allItems) {
      const key = String(item.id);
      if (!itemMap.has(key)) itemMap.set(key, item);
    }
    return playbackHistory
      .filter((e: PlaybackEntry) => e.progressPct > 5 && e.progressPct < 95 && !e.watched)
      .sort((a: PlaybackEntry, b: PlaybackEntry) => b.updatedAt - a.updatedAt)
      .map((e: PlaybackEntry) => {
        const id = e.contentId.includes(':') ? e.contentId.split(':').pop() ?? e.contentId : e.contentId;
        return itemMap.get(id);
      })
      .filter((item): item is CatalogMeta => item !== undefined)
      .slice(0, 20);
  }, [playbackHistory, catalog, sections]);

  // "Because you watched X"
  const recentlyWatched = React.useMemo(() => {
    if (!playbackHistory || playbackHistory.length === 0) return null;
    const sorted = [...playbackHistory].sort((a: PlaybackEntry, b: PlaybackEntry) => b.updatedAt - a.updatedAt);
    return sorted[0] as PlaybackEntry;
  }, [playbackHistory]);

  const recentlyWatchedId = recentlyWatched?.contentId?.includes(':')
    ? recentlyWatched.contentId.split(':').pop() ?? recentlyWatched.contentId
    : recentlyWatched?.contentId ?? '';
  const recentlyWatchedType = recentlyWatched?.contentType ?? 'movie';

  const { data: recentlyWatchedMeta } = useQuery<CatalogMeta>({
    queryKey: ['catalogMeta', recentlyWatchedType, recentlyWatchedId],
    queryFn: () => endpoints.catalog.getMeta(recentlyWatchedType, recentlyWatchedId).then(r => r.data),
    enabled: !!recentlyWatchedId,
    staleTime: 5 * 60_000,
  });

  const becauseYouWatched = React.useMemo(() => {
    if (!recentlyWatchedMeta?.similar || recentlyWatchedMeta.similar.length < 4) return { title: '', items: [] };
    const name = recentlyWatchedMeta.title || recentlyWatchedMeta.name || '';
    return {
      title: t('home.becauseYouWatched', { title: name }),
      items: recentlyWatchedMeta.similar.slice(0, 20),
    };
  }, [recentlyWatchedMeta, t]);

  return {
    continueWatchingItems: filterForKids(continueWatchingItems),
    recentlyAddedItems: filterForKids(recentlyAddedItems),
    becauseYouWatched: {
      ...becauseYouWatched,
      items: filterForKids(becauseYouWatched.items),
    },
  };
}

