import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { formatCacheAge, FILTER_GROUPS, SORT_LABELS, type SortKey } from './sourceUtils';

interface SourcesSidebarProps {
  sortBy: SortKey;
  setSortBy: (key: SortKey) => void;
  activeFilters: Set<string>;
  setActiveFilters: Dispatch<SetStateAction<Set<string>>>;
  toggleFilter: (tag: string) => void;
  cachedAt: number | null;
  isStale: boolean;
  onForceRefresh: () => void;
}

export function SourcesSidebar({
  sortBy, setSortBy, activeFilters, setActiveFilters, toggleFilter,
  cachedAt, isStale, onForceRefresh,
}: SourcesSidebarProps) {
  const { t } = useTranslation();
  return (
    <aside aria-label={t('sources.filterSidebar')} className="w-[210px] shrink-0 border-r border-[var(--color-border)] py-5 px-3.5
                      overflow-y-auto flex flex-col gap-5 scrollbar-hide">
      {/* Sort by */}
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/[0.28]
                      mb-2 ml-0.5">
          {t('sources.sortBy')}
        </p>
        <div className="flex flex-col gap-0.5">
          {SORT_LABELS.map(([key, label]) => (
            <button
              key={key} onClick={() => setSortBy(key)}
              className={[
                'flex items-center gap-2 w-full px-2.5 py-[7px] rounded-[7px] border-none',
                'text-xs cursor-pointer text-left transition-colors duration-[120ms] ease-linear',
                sortBy === key
                  ? 'bg-white/[0.09] text-white/[0.92] font-bold'
                  : 'bg-transparent text-white/[0.38] font-medium',
              ].join(' ')}
            >
              <span className={[
                'w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-[120ms]',
                sortBy === key ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-white-12)]',
              ].join(' ')} />
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      {/* Filter groups */}
      {FILTER_GROUPS.map(group => {
        const groupActive = [...activeFilters].some(t => (group.tags as readonly string[]).includes(t));
        return (
          <div key={group.label}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/[0.28] m-0">
                {t(group.label)}
              </p>
              {groupActive && (
                <button
                  onClick={() => setActiveFilters(prev => {
                    const next = new Set(prev);
                    for (const t of group.tags) next.delete(t);
                    return next;
                  })}
                  aria-label={t('sources.clearGroupFilter')}
                  className="bg-transparent border-none cursor-pointer text-white/25 text-[11px] px-[3px] py-px"
                >✕</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {group.tags.map(tag => {
                const on = activeFilters.has(tag);
                return (
                  <button
                    key={tag} onClick={() => toggleFilter(tag)}
                    aria-pressed={on}
                    className={[
                      'px-2 py-[3px] rounded-[5px] cursor-pointer',
                      'text-xs font-bold tracking-[0.05em] uppercase whitespace-nowrap',
                      'transition-colors duration-[120ms] ease-linear',
                      on
                        ? 'border border-[var(--color-white-30)] bg-[var(--color-border-medium)] text-white/[0.92]'
                        : 'border border-white/[0.07] bg-white/[0.02] text-white/[0.35]',
                    ].join(' ')}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="h-px bg-[var(--color-border)]" />

      {/* Clear + Cache + Refresh */}
      <div className="flex flex-col gap-2.5">
        {activeFilters.size > 0 && (
          <button
            onClick={() => setActiveFilters(new Set())}
            className="bg-transparent border-none cursor-pointer text-[13px] text-white/[0.35]
                       underline text-left p-0"
          >
            {t('sources.clearAllFilters')}
          </button>
        )}
        {cachedAt && (
          <p className={[
            'text-xs m-0 leading-[1.4]',
            isStale ? 'text-amber-400' : 'text-white/[0.22]',
          ].join(' ')}>
            {isStale ? t('sources.outdatedResults') : t('sources.updatedAt', { time: formatCacheAge(cachedAt) })}
          </p>
        )}
        <button
          onClick={onForceRefresh}
          aria-label={t('sources.refreshSources')}
          className="flex items-center gap-1.5 px-2.5 py-[7px] rounded-[7px]
                     border border-[var(--color-border-medium)] bg-[var(--color-white-4)]
                     text-white/[0.55] text-[13px] font-semibold cursor-pointer
                     transition-colors duration-[120ms] ease-linear"
        >
          <RefreshCw size={12} /> {t('common.refresh')}
        </button>
      </div>
    </aside>
  );
}
