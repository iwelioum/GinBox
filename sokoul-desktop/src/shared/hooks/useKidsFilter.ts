// useKidsFilter.ts — Hook to filter content for kids profiles
import { useCallback } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { isKidsAppropriate } from '@/shared/utils/kidsFilter';

/**
 * Returns a filter function that passes all items through when
 * the active profile is not a kids profile, and filters
 * inappropriate content when it is.
 */
export function useKidsFilter<T extends { genre_ids?: number[]; genres?: Array<{ id?: number; name?: string } | string> }>() {
  const isKids = useProfileStore(s => s.activeProfile?.isKids ?? false);

  const filterForKids = useCallback(
    (items: T[]): T[] => {
      if (!isKids) return items;
      return items.filter(isKidsAppropriate);
    },
    [isKids],
  );

  return { isKidsProfile: isKids, filterForKids };
}
