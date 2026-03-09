import { useQuery } from '@tanstack/react-query';
import type { CatalogMeta } from '@/shared/types';
import { endpoints } from '@/shared/api/client';
import { getLogo, type FanartResponse } from '@/shared/utils/fanart';

/**
 * Fetches logo artwork for a content card.
 * Query keys match the detail page to leverage shared React Query cache.
 */
export function useContentCardData(item: CatalogMeta) {
  const type = item.media_type ?? item.type ?? 'movie';
  const id = item.id;
  const ft = type === 'movie' ? 'movie' : 'tv';

  const { data: fanart } = useQuery<FanartResponse | null>({
    queryKey: ['fanart', type, id],
    queryFn: async () => {
      const tmdbId = id.split(':')[1] || id;
      try {
        return (await endpoints.fanart.get(ft, tmdbId)).data as FanartResponse;
      } catch {
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const { data: images } = useQuery<{ logos?: string[] }>({
    queryKey: ['images', type, id],
    queryFn: () =>
      endpoints.catalog
        .getImages(type, id)
        .then((r) => r.data as unknown as { logos?: string[] }),
    staleTime: Infinity,
    retry: false,
  });

  const logoUrl = getLogo(fanart, ft) || images?.logos?.[0] || null;

  return { logoUrl, type, id };
}
