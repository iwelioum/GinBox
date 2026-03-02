import { useQuery } from '@tanstack/react-query';

// Placeholder — l'endpoint /collection/:id sera ajouté ultérieurement
/**
 * Fetches movie collection (saga) data from the Rust backend.
 * Disabled until the /collection/:id endpoint ships; returns null as a stable placeholder
 * so consumers can already wire up UI without breaking when the API lands.
 */
export function useCollectionQuery(collectionId: number | undefined) {
  return useQuery({
    queryKey:  ['collection', collectionId],
    queryFn:   () => Promise.resolve(null),
    enabled:   false,
    staleTime: Infinity,
  });
}
