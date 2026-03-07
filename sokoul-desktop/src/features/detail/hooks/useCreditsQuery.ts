import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/shared/api/client';
import type { ContentType, Credits } from '../../../shared/types/index';

/**
 * Fetches cast and crew credits for a content item from the Rust backend.
 * Kept as a separate query (not embedded in detail) because credits are only
 * rendered below the fold, so lazy-loading avoids blocking the initial detail paint.
 */
export function useCreditsQuery(type: ContentType, id: string) {
  return useQuery<Credits>({
    queryKey:  ['credits', type, id],
    queryFn:   () => endpoints.catalog.getCredits(type, id).then(r => r.data as Credits),
    enabled:   !!type && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
