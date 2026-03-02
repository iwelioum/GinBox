import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../../../api/client';
import type { CatalogMeta, ContentType } from '../../../shared/types/index';

/**
 * Fetches full metadata for a single content item from the Rust backend.
 * Cached for 5 min to avoid redundant calls when navigating back from sub-views.
 * Disabled until both type and id are truthy to prevent invalid requests on first render.
 */
export function useDetailQuery(type: ContentType, id: string) {
  return useQuery<CatalogMeta>({
    queryKey:  ['catalogMeta', type, id],
    queryFn:   () => endpoints.catalog.getMeta(type, id).then(r => r.data),
    enabled:   !!type && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
