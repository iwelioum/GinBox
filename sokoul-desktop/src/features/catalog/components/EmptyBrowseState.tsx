// EmptyBrowseState.tsx — No-results view when filters yield nothing

import * as React from 'react';
import { useTranslation }    from 'react-i18next';
import { SearchX }           from 'lucide-react';
import type { FilterState }  from '@/features/catalog/components/CatalogFilters';
import type { BrowsePageMode } from './browseConstants';
import { buildDefaultFilters } from './browseConstants';

interface EmptyBrowseStateProps {
  mode:       BrowsePageMode;
  onReset:    React.Dispatch<React.SetStateAction<FilterState>>;
}

export function EmptyBrowseState({ mode, onReset }: EmptyBrowseStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-muted">
      <SearchX size={46} className="mb-4 text-text-muted" />
      <p className="text-base font-medium">{t('browse.noResults')}</p>
      <button
        onClick={() => onReset(buildDefaultFilters(mode))}
        className="mt-4 text-sm text-text-secondary hover:text-accent underline underline-offset-2 transition-colors"
      >
        {t('browse.resetFilters')}
      </button>
    </div>
  );
}
