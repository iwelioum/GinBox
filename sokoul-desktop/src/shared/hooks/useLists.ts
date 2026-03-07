// useLists.ts — Role: Fixed useListItems
// RULES: None

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/shared/api/client';
import { useProfileStore } from '@/stores/profileStore';
import type { UserList, ListItem, ContentType } from '../types/index';

/** Fetches all user lists scoped to the active profile, ensuring each profile sees only its own watchlists and favorites. */
export function useLists() {
  const profileId = useProfileStore((s) => s.activeProfile?.id);

  return useQuery<UserList[]>({
    queryKey: ['lists', profileId],
    queryFn:  () => endpoints.lists.list(profileId!).then((r) => r.data),
    enabled:  profileId != null,
    staleTime: 30_000,
  });
}

/** Loads items for a specific list on demand; avoids prefetching all lists' items to keep memory usage low. */
export function useListItems(listId: number | null) {
  return useQuery<ListItem[]>({
    queryKey: ['list-items', listId],
    queryFn:  () => endpoints.lists.getItems(listId!).then((r) => r.data),
    enabled:  listId != null,
    staleTime: 30_000,
  });
}

/** Adds content to a list and invalidates the cache so the UI updates without a full refetch. */
export function useAddToList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, contentId, contentType }: {
      listId: number; contentId: string; contentType: ContentType;
    }) => endpoints.lists.addItem(listId, contentId, contentType),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: ['list-items', listId] });
    },
  });
}

/** Removes content from a list and invalidates the cache to keep the list UI in sync immediately. */
export function useRemoveFromList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, contentId }: { listId: number; contentId: string }) =>
      endpoints.lists.removeItem(listId, contentId),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: ['list-items', listId] });
    },
  });
}
