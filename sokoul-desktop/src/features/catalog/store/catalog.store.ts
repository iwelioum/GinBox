/**
 * Catalog store — pure state container for homepage rail data.
 * No API calls here; data fetching lives in useCatalogLoader.
 * The store is the single source of truth for section data,
 * favorites map, and loading/error state.
 */

import { create } from 'zustand';
import type { CatalogMeta } from '../../../shared/types/index';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning — A good movie to start the day?';
  if (h >= 12 && h < 17) return 'Good afternoon — What are you in the mood for?';
  if (h >= 17 && h < 21) return "Good evening — It's movie time.";
  if (h >= 21 && h < 24) return 'Good night — One last movie?';
  return 'Still up? Perfect.';
}

const STALE_MS = 5 * 60_000;

/** Internal contract for the catalog Zustand slice — keeps state shape explicit and prevents accidental additions. */
interface CatalogStore {
  favoritesMap:    Map<string, boolean>;
  setFavoritesMap: (map: Map<string, boolean>) => void;
  isInFavorites:   (contentId: string) => boolean;

  sections:  Record<string, CatalogMeta[]>;
  catalog:   Record<string, CatalogMeta[]> | null;
  loading:   boolean;
  error:     string | null;
  greeting:  string;
  loadedAt:  number;

  setSections: (sections: Record<string, CatalogMeta[]>) => void;
  setLoading:  (loading: boolean) => void;
  setError:    (error: string | null) => void;
  setLoadedAt: (ts: number) => void;
  isStale:     () => boolean;
}

/**
 * Pure state container for homepage rail data — no API calls live here.
 * All fetching is delegated to useCatalogLoader to enforce the store = state, hook = effect boundary.
 * Includes a staleness check (5 min) so the catalog auto-refreshes after idle periods.
 */
export const useCatalogStore = create<CatalogStore>((set, get) => ({
  favoritesMap:    new Map(),
  setFavoritesMap: (map) => set({ favoritesMap: map }),
  isInFavorites:   (contentId) => get().favoritesMap.has(contentId),

  sections:  {},
  catalog:   null,
  loading:   false,
  error:     null,
  greeting:  getGreeting(),
  loadedAt:  0,

  setSections: (sections) => set({ sections, catalog: sections }),
  setLoading:  (loading) => set({ loading }),
  setError:    (error) => set({ error }),
  setLoadedAt: (ts) => set({ loadedAt: ts }),
  isStale:     () => Date.now() - get().loadedAt >= STALE_MS,
}));
