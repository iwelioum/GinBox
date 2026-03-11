import { useQuery } from '@tanstack/react-query';
import { endpoints } from '@/shared/api/client';
import type { ContentType } from '../../../shared/types/index';

export interface MediaImages {
  backdrops?: { file_path: string }[];
  posters?: { file_path: string }[];
  logos?: string[];
}

/**
 * Fetches gallery images (scenes, posters, logos) for a content item.
 * staleTime is Infinity because image URLs from TMDB are immutable CDN links
 * that never change for a given content id, so re-fetching wastes bandwidth.
 */
export function useImagesQuery(type: ContentType, id: string) {
  return useQuery<MediaImages>({
    queryKey:  ['images', type, id],
    queryFn:   () => endpoints.catalog.getImages(type, id).then(r => r.data as unknown as MediaImages),
    enabled:   !!type && !!id,
    staleTime: Infinity,
  });
}
