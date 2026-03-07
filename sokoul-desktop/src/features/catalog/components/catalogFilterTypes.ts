// catalogFilterTypes.ts — Shared types, constants, and utilities for catalog filters

import type { ContentKind, SeriesStatus } from '@/shared/utils/contentKind';
import type { CatalogMeta, StreamingProvider, UserWatchStatus } from '@/shared/types';

/* ─── Scalar types ─── */

export type AvailabilitySource = 'local' | 'debrid' | 'streaming';
export type SortOption = 'popularity' | 'rating' | 'year_desc' | 'year_asc' | 'title_asc' | 'title_desc';
export type AgeRating = 'all' | '10+' | '12+' | '16+' | '18+' | 'nc';

/* ─── FilterState ─── */

export interface FilterState {
  searchQuery:       string;
  sortBy:            SortOption;
  kinds:             ContentKind[];
  genres:            string[];
  ratingMin:         number;
  votesMin:          number;
  popularityTopN:    number | null;
  yearRange:         [number, number];
  seriesStatuses:    SeriesStatus[];
  originalLanguages: string[];
  countries:         string[];
  movieRuntimeRange: [number, number] | null;
  seasonsRange:      [number, number] | null;
  episodeRtRange:    [number, number] | null;
  availSources:        AvailabilitySource[];
  selectedProviders:   string[];
  watchableNow:        boolean;
  streamingType:       'all' | 'sub' | 'rent_buy';
  userStatuses:        UserWatchStatus[];
  selectedCollections: number[];
  selectedStudios:     number[];
  selectedRatings:     AgeRating[];
}

/* ─── Year bounds ─── */

export const YEAR_MIN = 1920;
export const YEAR_MAX = new Date().getFullYear();

/* ─── Defaults ─── */

export const DEFAULT_FILTERS: FilterState = {
  searchQuery:       '',
  sortBy:            'popularity',
  kinds:             [],
  genres:            [],
  ratingMin:         0,
  votesMin:          0,
  popularityTopN:    null,
  yearRange:         [YEAR_MIN, YEAR_MAX],
  seriesStatuses:    [],
  originalLanguages: [],
  countries:         [],
  movieRuntimeRange: null,
  seasonsRange:      null,
  episodeRtRange:    null,
  availSources:        [],
  selectedProviders:   [],
  watchableNow:        false,
  streamingType:       'all',
  userStatuses:        [],
  selectedCollections: [],
  selectedStudios:     [],
  selectedRatings:     [],
};

/* ─── EnrichedItem ─── */

export interface EnrichedItem extends CatalogMeta {
  _kind:          ContentKind;
  _genres:        string[];
  _year:          number | null;
  _status:        SeriesStatus;
  _lang:          string;
  _countries:     string[];
  _rating:        number | null;
  _votes:         number;
  _popularity:    number;
  _popRank:       number;
  _movieRuntime:  number | null;
  _seasonCount:   number | null;
  _episodeCount:  number | null;
  _episodeRuntime: number | null;
  _isLocal:      boolean;
  _isDebrid:     boolean;
  _providers:    StreamingProvider[];
  _isWatchable:  boolean;
  _providerIds:  string[];
  _userStatus:   UserWatchStatus;
  _userProgress: number;
  _userRating:   number | null;
}

/* ─── Utility ─── */

export const countActiveFilters = (f: FilterState): number => {
  let count = 0;
  if (f.kinds.length > 0) count++;
  if (f.genres.length > 0) count++;
  if (f.ratingMin > 0) count++;
  if (f.votesMin > 0) count++;
  if (f.popularityTopN !== null) count++;
  if (f.yearRange[0] !== YEAR_MIN || f.yearRange[1] !== YEAR_MAX) count++;
  if (f.seriesStatuses.length > 0) count++;
  if (f.originalLanguages.length > 0) count++;
  if (f.countries.length > 0) count++;
  if (f.movieRuntimeRange !== null) count++;
  if (f.seasonsRange !== null) count++;
  if (f.episodeRtRange !== null) count++;
  if (f.watchableNow) count++;
  if (f.availSources.length > 0) count++;
  if (f.selectedProviders.length > 0) count++;
  if (f.streamingType !== 'all') count++;
  if (f.userStatuses.length > 0) count++;
  if (f.selectedCollections.length > 0) count++;
  if (f.selectedStudios.length > 0) count++;
  if (f.selectedRatings.length > 0) count++;
  return count;
};

/* ─── Shared sub-component props ─── */

export interface FilterSectionProps {
  filters:  FilterState;
  onChange: (f: FilterState) => void;
}
