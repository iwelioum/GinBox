import axios from 'axios';
import type {
  Profile, UserList, ListItem, CatalogMeta, ContentType,
  SourcesResponse, PlaybackEntry, CastMember, UserProgressEntry,
  CollectionItem, CollectionDetail,
} from '../types';
import { useLogStore } from '@/stores/logStore';

/** Singleton Axios instance pointed at the local Rust backend; all API calls must go through this client to ensure consistent logging and error handling. */
export const client = axios.create({
  baseURL: 'http://127.0.0.1:3000',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  useLogStore.getState().addLog('info', 'API', `${config.method?.toUpperCase()} ${config.url}`, {
    body: config.data,
  });
  return config;
});

client.interceptors.response.use(
  (response) => {
    useLogStore.getState().addLog('success', 'API', `${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      useLogStore.getState().addLog('error', 'API',
        `${error.response?.status ?? 'ERR'} ${error.config?.url}`,
        { message: error.message, data: error.response?.data }
      );
    }
    return Promise.reject(error);
  }
);

/** Typed API endpoint map grouping all backend calls by domain; centralizes URL construction and response typing to prevent drift between frontend and backend. */
export const endpoints = {
  profiles: {
    list:   () => client.get<Profile[]>('/profiles'),
    create: (data: { name: string; is_kids: boolean; avatar_url?: string }) =>
      client.post<Profile>('/profiles', data),
    delete: (id: number) => client.delete(`/profiles/${id}`),
  },

  catalog: {
    get: (type: ContentType, id: string, params?: Record<string, string>) =>
      client.get<{ metas: CatalogMeta[]; hasMore?: boolean }>(`/catalog/${type}/${id}`, { params }),
    getMeta: (type: ContentType, contentId: string) =>
      client.get<CatalogMeta>(`/catalog/${type}/meta/${contentId}`),
    getCredits: (type: ContentType, contentId: string) => {
      const id = contentId.split(':').pop() || contentId;
      return client.get<{ cast: CastMember[] }>(`/catalog/${type}/${id}/credits`);
    },
    getImages: (type: string, id: string) =>
      client.get<Record<string, Array<{ file_path: string }>>>(`/catalog/${type}/${id}/images`),
    search: (q: string, type: string = 'multi') =>
      client.get<{ metas: CatalogMeta[] }>(`/search`, { params: { q, type } }),
    getPersonMovies: (personId: string) =>
      client.get<{ metas: CatalogMeta[] }>(`/catalog/person/${personId}/movies`),
  },

  sources: {
    get: (type: ContentType, contentId: string, params?: Record<string, string | number | boolean>) =>
      client.get<SourcesResponse>(`/sources/${type}/${contentId}`, { params }),
  },

  debrid: {
    unrestrict: (magnet: string, cached: boolean) =>
      client.post<{ stream_url: string }>('/debrid/unrestrict', { magnet, cached }),
  },

  fanart: {
    get: (type: 'movie' | 'tv', tmdbId: string) =>
      client.get<unknown>(`/fanart/${type}/${tmdbId}`),
  },

  lists: {
    list:       (profileId: number) => client.get<UserList[]>(`/lists?profile_id=${profileId}`),
    getItems:   (listId: number)    => client.get<ListItem[]>(`/lists/${listId}/items`),
    create:     (profileId: number, name: string) =>
      client.post<UserList>('/lists', { profile_id: profileId, name }),
    addItem:    (listId: number, contentId: string, contentType: ContentType) =>
      client.post(`/lists/${listId}/items`, { content_id: contentId, content_type: contentType }),
    removeItem: (listId: number, contentId: string) =>
      client.delete(`/lists/${listId}/items/${contentId}`),
  },

  playback: {
    getPosition: (contentId: string, profileId: number, season?: number, episode?: number) =>
      client.get<PlaybackEntry | null>(`/playback/position/${contentId}`, {
        params: { profile_id: profileId, season, episode },
      }),
    history: (profileId: number, limit = 500) =>
      client.get<PlaybackEntry[]>('/playback/history', {
        params: { profile_id: profileId, limit },
      }),
    savePosition: (data: {
      content_id: string;
      content_type: ContentType;
      profile_id: number;
      season?: number | null;
      episode?: number | null;
      position_ms: number;
      duration_ms: number;
      episode_title?: string;
      still_path?: string;
    }) =>
      client.post('/playback/position', data),
  },

  trakt: {
    getReviews: (type: ContentType, id: string) =>
      client.get<{
        rating:   number;
        votes:    number;
        pctLiked: number;
        comments: Array<{
          id: number; comment: string; spoiler: boolean;
          likes: number; createdAt: string; author: string;
        }>;
      }>(`/trakt/${type}/${id}/reviews`),
  },

  userProgress: {
    list: (profileId: number) =>
      client.get<UserProgressEntry[]>(`/user/progress?profile_id=${profileId}`),
    set: (data: { profileId: number; contentId: string; status: string; progress?: number; rating?: number }) =>
      client.post<UserProgressEntry>('/user/progress', {
        profile_id: data.profileId,
        content_id: data.contentId,
        status:     data.status,
        progress:   data.progress,
        rating:     data.rating,
      }),
  },

  collections: {
    getAll: (page = 1, limit = 24) =>
      client.get<{ collections: CollectionItem[]; total_pages: number; total_results: number }>(
        '/collections/all', { params: { page, limit } }
      ),
    getById: (collectionId: number | string) =>
      client.get<CollectionDetail>(`/collections/${collectionId}`),
  },
};
