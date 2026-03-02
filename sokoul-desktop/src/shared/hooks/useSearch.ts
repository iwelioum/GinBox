import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../../api/client';

/** Debounces catalog search to avoid flooding the API on every keystroke; only fires after 3+ chars to reduce noise. */
export const useSearch = (query: string, type: 'movie' | 'series') => {
  return useQuery({
    queryKey: ['search', type, query],
    queryFn: () => endpoints.catalog.search(type, query),
    enabled: !!query && query.length > 2,
  });
};