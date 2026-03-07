// BrowseFiltersBar.tsx — Type-tab bar, filter button, and active filter chips

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X } from 'lucide-react';
import { YEAR_MIN, YEAR_MAX } from '@/features/catalog/components/CatalogFilters';
import type { FilterState }    from '@/features/catalog/components/CatalogFilters';
import {
  TYPE_TABS,
  KIND_LABEL_KEYS,
  type ContentTabValue,
  type BrowsePageMode,
} from './browseConstants';
import { buildDefaultFilters } from './browseConstants';

/* ─── FilterChip ─── */

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 border border-white/5">
      {label}
      <button onClick={onRemove} className="text-white/30 hover:text-white transition-colors ml-0.5">
        <X size={12} />
      </button>
    </span>
  );
}

/* ─── Props ─── */

interface BrowseFiltersBarProps {
  mode:               BrowsePageMode;
  filters:            FilterState;
  filteredCount:      number;
  activeFiltersCount: number;
  currentKindTab:     ContentTabValue | 'custom';
  onTabClick:         (val: ContentTabValue) => void;
  onOpenDrawer:       () => void;
  onChangeFilters:    React.Dispatch<React.SetStateAction<FilterState>>;
}

export function BrowseFiltersBar({
  mode,
  filters,
  filteredCount,
  activeFiltersCount,
  currentKindTab,
  onTabClick,
  onOpenDrawer,
  onChangeFilters,
}: BrowseFiltersBarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Tab bar + filter button row ── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">

        {/* Type tabs (all mode only) */}
        {mode === 'all' && (
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {TYPE_TABS.map((tab) => {
              const isActive = currentKindTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabClick(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${isActive
                      ? 'bg-white text-black shadow-lg shadow-black/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <tab.icon size={15} strokeWidth={2.2} />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1" />

        {/* Filter button */}
        <button
          onClick={onOpenDrawer}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border
            ${activeFiltersCount > 0
              ? 'bg-white/15 border-white/40 text-white'
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
          <SlidersHorizontal size={15} strokeWidth={2.2} />
          <span>{t('common.filters')}</span>
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5
                             bg-blue-500 text-white text-[10px] font-bold
                             rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Active filter chips ── */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-white/30 mr-1">
            {t('common.resultCount', { count: filteredCount })}
          </span>

          {mode === 'all' && filters.kinds.length > 0 && (
            <FilterChip
              label={filters.kinds.map(k => t(KIND_LABEL_KEYS[k] ?? k)).join(', ')}
              onRemove={() => onChangeFilters(f => ({ ...f, kinds: [] }))}
            />
          )}
          {filters.genres.length > 0 && (
            <FilterChip
              label={filters.genres.join(', ')}
              onRemove={() => onChangeFilters(f => ({ ...f, genres: [] }))}
            />
          )}
          {(filters.yearRange[0] !== YEAR_MIN || filters.yearRange[1] !== YEAR_MAX) && (
            <FilterChip
              label={`${filters.yearRange[0]}–${filters.yearRange[1] === YEAR_MAX ? t('common.today') : filters.yearRange[1]}`}
              onRemove={() => onChangeFilters(f => ({ ...f, yearRange: [YEAR_MIN, YEAR_MAX] }))}
            />
          )}
          {filters.ratingMin > 0 && (
            <FilterChip
              label={`≥ ${filters.ratingMin} ★`}
              onRemove={() => onChangeFilters(f => ({ ...f, ratingMin: 0 }))}
            />
          )}
          {filters.originalLanguages.length > 0 && (
            <FilterChip
              label={filters.originalLanguages.join(', ').toUpperCase()}
              onRemove={() => onChangeFilters(f => ({ ...f, originalLanguages: [] }))}
            />
          )}
          {filters.availSources.length > 0 && (
            <FilterChip
              label={t('browse.availability')}
              onRemove={() => onChangeFilters(f => ({ ...f, availSources: [] }))}
            />
          )}

          <button
            onClick={() => onChangeFilters(buildDefaultFilters(mode))}
            className="text-xs text-red-400/60 hover:text-red-400 ml-2 transition-colors font-medium"
          >
            {t('browse.clearAll')}
          </button>
        </div>
      )}
    </>
  );
}
