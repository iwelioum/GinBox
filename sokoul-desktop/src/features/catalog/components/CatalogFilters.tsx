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

  return (
    <div className="space-y-6 text-sm">
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
