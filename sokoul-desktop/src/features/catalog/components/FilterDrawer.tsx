// FilterDrawer.tsx — Slide-in filter drawer panel

import * as React from 'react';
import { useTranslation }    from 'react-i18next';
import { X }                 from 'lucide-react';
import { CatalogFilters }    from '@/features/catalog/components/CatalogFilters';
import type { FilterState, EnrichedItem } from '@/features/catalog/components/CatalogFilters';
import type { BrowsePageMode } from './browseConstants';
import { buildDefaultFilters } from './browseConstants';

interface FilterDrawerProps {
  mode:               BrowsePageMode;
  filters:            FilterState;
  enrichedItems:      EnrichedItem[];
  genreItems:         EnrichedItem[];
  langCountryItems:   EnrichedItem[];
  availabilityItems:  EnrichedItem[];
  filteredCount:      number;
  activeFiltersCount: number;
  profileActive:      boolean;
  onChangeFilters:    React.Dispatch<React.SetStateAction<FilterState>>;
  onClose:            () => void;
}

export function FilterDrawer({
  mode,
  filters,
  enrichedItems,
  genreItems,
  langCountryItems,
  availabilityItems,
  filteredCount,
  activeFiltersCount,
  profileActive,
  onChangeFilters,
  onClose,
}: FilterDrawerProps) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60  z-[100]"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-[380px] z-[101]
                      bg-[var(--color-bg-base)] border-l border-white/10
                      flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              {t('filters.heading')}
            </h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500 text-xs font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          <CatalogFilters
            allItems={enrichedItems}
            genreItems={genreItems}
            langCountryItems={langCountryItems}
            availabilityItems={availabilityItems}
            filters={filters}
            onChange={onChangeFilters}
            profileActive={profileActive}
          />
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-t border-white/10 bg-[var(--color-bg-base)]">
          <button
            onClick={() => onChangeFilters(buildDefaultFilters(mode))}
            className="text-sm font-medium text-white/40 hover:text-white transition-colors"
          >
            {t('common.reset')}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-lg active:scale-95"
          >
            {t('browse.viewResults', { count: filteredCount })}
          </button>
        </div>
      </div>
    </>
  );
}
