// CatalogFilters.tsx — Thin composer that imports and renders sub-filter sections.
// Re-exports all public types/constants so existing consumer imports remain valid.

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_FILTERS, YEAR_MIN, YEAR_MAX } from './catalogFilterTypes';
import { ContentTypeFilter } from './filters/ContentTypeFilter';
import { GenreFilter }              from './filters/GenreFilter';
import { YearRangeFilter }          from './filters/YearRangeFilter';
import { RatingPopularityFilter }   from './filters/RatingPopularityFilter';
import { LanguageCountryFilter }    from './filters/LanguageCountryFilter';
import { DurationStructureFilter }  from './filters/DurationStructureFilter';
import { AvailabilityFilter }       from './filters/AvailabilityFilter';
import { StatusProgressFilter }     from './filters/StatusProgressFilter';
import { AgeRatingFilter }          from './filters/AgeRatingFilter';

// Re-export everything that other files import from this module
export {
  YEAR_MIN,
  YEAR_MAX,
  DEFAULT_FILTERS,
  countActiveFilters,
} from './catalogFilterTypes';
export type {
  FilterState,
  EnrichedItem,
  SortOption,
  AvailabilitySource,
  AgeRating,
} from './catalogFilterTypes';

/* ─── Props ─── */

interface CatalogFiltersProps {
  allItems:          import('./catalogFilterTypes').EnrichedItem[];
  genreItems:        import('./catalogFilterTypes').EnrichedItem[];
  langCountryItems:  import('./catalogFilterTypes').EnrichedItem[];
  availabilityItems: import('./catalogFilterTypes').EnrichedItem[];
  filters:           import('./catalogFilterTypes').FilterState;
  onChange:          (f: import('./catalogFilterTypes').FilterState) => void;
  profileActive:     boolean;
}

/* ─── Composer ─── */

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  allItems,
  genreItems,
  langCountryItems,
  availabilityItems,
  filters,
  onChange,
  profileActive,
}) => {
  const { t } = useTranslation();

  const hasAnyFilter = React.useMemo(() =>
    filters.kinds.length > 0 ||
    filters.genres.length > 0 ||
    filters.ratingMin > 0 ||
    filters.votesMin > 0 ||
    filters.popularityTopN !== null ||
    filters.yearRange[0] !== YEAR_MIN || filters.yearRange[1] !== YEAR_MAX ||
    filters.seriesStatuses.length > 0 ||
    filters.originalLanguages.length > 0 ||
    filters.countries.length > 0 ||
    filters.movieRuntimeRange !== null ||
    filters.seasonsRange !== null ||
    filters.episodeRtRange !== null ||
    filters.watchableNow ||
    filters.availSources.length > 0 ||
    filters.selectedProviders.length > 0 ||
    filters.streamingType !== 'all' ||
    filters.userStatuses.length > 0 ||
    filters.selectedRatings.length > 0,
  [filters]);

  const handleReset = React.useCallback(() => {
    onChange(DEFAULT_FILTERS);
  }, [onChange]);

  return (
    <div className="space-y-7 text-sm">
      {/* Header + Reset */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white/90 tracking-wide uppercase">
          {t('filters.heading')}
        </h2>
        {hasAnyFilter && (
          <button
            onClick={handleReset}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            {t('filters.reset')}
          </button>
        )}
      </div>

      <ContentTypeFilter        allItems={allItems} filters={filters} onChange={onChange} />
      <GenreFilter              genreItems={genreItems} filters={filters} onChange={onChange} />
      <YearRangeFilter          filters={filters} onChange={onChange} />
      <RatingPopularityFilter   allItems={allItems} filters={filters} onChange={onChange} />
      <LanguageCountryFilter    langCountryItems={langCountryItems} filters={filters} onChange={onChange} />
      <DurationStructureFilter  allItems={allItems} filters={filters} onChange={onChange} />
      <AvailabilityFilter       availabilityItems={availabilityItems} allItems={allItems} filters={filters} onChange={onChange} />
      <StatusProgressFilter     allItems={allItems} filters={filters} onChange={onChange} profileActive={profileActive} />
      <AgeRatingFilter          filters={filters} onChange={onChange} />
    </div>
  );
};

export { CatalogFilters };
