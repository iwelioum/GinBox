import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/shared/api/client';
import type { CatalogMeta, ContentType } from '../../../shared/types/index';

/**
 * Extracts video trailers from the detail meta payload via select.
 * Shares the same query key as useDetailQuery to reuse cached data,
 * so mounting the trailer section never triggers an extra network request.
 */
export function useVideosQuery(type: ContentType, id: string) {
  return useQuery({
    queryKey:  ['catalogMeta', type, id],
    queryFn:   () => endpoints.catalog.getMeta(type, id).then(r => r.data),
    enabled:   !!type && !!id,
    staleTime: 5 * 60 * 1000,
    select:    (data: CatalogMeta) => data.videos ?? [],
  });
}
