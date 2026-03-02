import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../../../api/client';
import type { CatalogMeta, ContentType } from '../../../shared/types/index';

/**
 * Extracts similar-content recommendations from the detail meta payload via select.
 * Shares the same query key as useDetailQuery so the data is deduplicated in the cache,
 * avoiding a redundant network call when both hooks are mounted on the same page.
 */
export function useSimilarQuery(type: ContentType, id: string) {
  return useQuery({
    queryKey:  ['catalogMeta', type, id],
    queryFn:   () => endpoints.catalog.getMeta(type, id).then(r => r.data),
    enabled:   !!type && !!id,
    staleTime: 5 * 60 * 1000,
    select:    (data: CatalogMeta) => data.similar ?? [],
  });
}
