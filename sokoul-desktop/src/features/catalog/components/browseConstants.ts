// browseConstants.ts — Shared types, constants, and config for BrowsePage

import type { LucideIcon } from 'lucide-react';
import { Home, Film, Tv } from 'lucide-react';
import type { ContentType } from '@/shared/types';
import type { EnrichedItem, FilterState } from '@/features/catalog/components/CatalogFilters';
import { DEFAULT_FILTERS } from '@/features/catalog/components/CatalogFilters';

/* ─── Types ─── */

export type CatalogId = 'popular' | 'top_rated';
export type ContentTabValue = 'all' | 'movie' | 'tv';
export type BrowsePageMode = 'all' | 'movie' | 'series';

export interface ContentSectionData {
  id:            string;
  title:         string;
  subtitle:      string;
  accentColor:   string;
  icon?:         LucideIcon;
  items:         EnrichedItem[];
  showProgress?: boolean;
}

/* ─── Constants ─── */

export const CATALOG_SOURCES: { type: ContentType; id: CatalogId }[] = [
  { type: 'movie',  id: 'popular'   },
  { type: 'movie',  id: 'top_rated' },
  { type: 'series', id: 'popular'   },
  { type: 'series', id: 'top_rated' },
];

export const INITIAL_PAGES = 2;
export const MORE_PAGES    = 2;

export const TYPE_TABS: { value: ContentTabValue; labelKey: string; icon: LucideIcon }[] = [
  { value: 'all',   labelKey: 'catalog.tabAll',    icon: Home },
  { value: 'movie', labelKey: 'catalog.tabFilms',  icon: Film },
  { value: 'tv',    labelKey: 'catalog.tabSeries', icon: Tv },
];

export const SORT_OPTIONS: { value: FilterState['sortBy']; labelKey: string }[] = [
  { value: 'popularity', labelKey: 'catalog.sortPopularity' },
  { value: 'rating',     labelKey: 'catalog.sortRating'     },
  { value: 'year_desc',  labelKey: 'catalog.sortNewest'     },
  { value: 'year_asc',   labelKey: 'catalog.sortOldest'     },
  { value: 'title_asc',  labelKey: 'catalog.sortAZ'         },
  { value: 'title_desc', labelKey: 'catalog.sortZA'         },
];

export const KIND_LABEL_KEYS: Record<string, string> = {
  movie:       'catalog.kindMovie',
  tv:          'catalog.kindTv',
  anime:       'catalog.kindAnime',
  animation:   'catalog.kindAnimation',
  miniseries:  'catalog.kindMiniseries',
  documentary: 'catalog.kindDocumentary',
  reality:     'catalog.kindReality',
  special:     'catalog.kindSpecial',
  short:       'catalog.kindShort',
};

export const GENRE_ACCENT: Record<string, string> = {
  'Action':          '#ef4444',
  'Science-Fiction': '#6366f1',
  'Drama':           '#a78bfa',
  'Comedy':          '#22c55e',
  'Thriller':        '#f59e0b',
  'Horror':          '#dc2626',
  'Romance':         '#ec4899',
  'Animation':       '#fb923c',
  'Fantasy':         '#8b5cf6',
  'Adventure':       '#14b8a6',
  'Mystery':         '#64748b',
  'Crime':           '#6b7280',
  'Documentary':     '#06b6d4',
  'History':         '#d97706',
  'War':             '#78716c',
  'Music':           '#f472b6',
  'Family':          '#10b981',
  'Western':         '#a04000',
  'Sci-Fi & Fantasy':'#4361ee',
  'War & Politics':  '#546e7a',
  'Reality TV':      '#00bcd4',
};

export const MOVIE_PAGE_KINDS: FilterState['kinds']  = ['movie', 'short', 'documentary'];
export const SERIES_PAGE_KINDS: FilterState['kinds'] = ['tv', 'anime', 'animation', 'miniseries'];

/* ─── Helpers ─── */

export function getKindsForMode(mode: BrowsePageMode): FilterState['kinds'] {
  if (mode === 'movie')  return MOVIE_PAGE_KINDS;
  if (mode === 'series') return SERIES_PAGE_KINDS;
  return [];
}

export function buildDefaultFilters(mode: BrowsePageMode): FilterState {
  return { ...DEFAULT_FILTERS, kinds: [...getKindsForMode(mode)] };
}
