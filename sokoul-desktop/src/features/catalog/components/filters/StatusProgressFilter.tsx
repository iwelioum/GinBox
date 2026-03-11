import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { UserRound } from 'lucide-react';
import type { SeriesStatus } from '@/shared/utils/contentKind';
import type { UserWatchStatus } from '@/shared/types';
import {
  SERIES_STATUS_UI,
  USER_STATUS_UI,
  SERIES_STATUS_ICONS,
  USER_STATUS_ICONS,
} from '../catalogFilterConstants';
import type { EnrichedItem, FilterSectionProps } from '../catalogFilterTypes';

interface StatusProgressFilterProps extends FilterSectionProps {
  allItems: EnrichedItem[];
  profileActive: boolean;
}

export const StatusProgressFilter: React.FC<StatusProgressFilterProps> = ({
  allItems, filters, onChange, profileActive,
}) => {
  const { t } = useTranslation();

  const showSeriesStatus =
    filters.kinds.length === 0 ||
    filters.kinds.some((k) => ['tv', 'anime', 'animation', 'miniseries'].includes(k));

  const toggleStatus = (s: SeriesStatus) =>
    onChange({
      ...filters,
      seriesStatuses: filters.seriesStatuses.includes(s)
        ? filters.seriesStatuses.filter((x) => x !== s)
        : [...filters.seriesStatuses, s],
    });

  const toggleUserStatus = (v: UserWatchStatus) =>
    onChange({
      ...filters,
      userStatuses: filters.userStatuses.includes(v)
        ? filters.userStatuses.filter((s) => s !== v)
        : [...filters.userStatuses, v],
    });

  return (
    <section>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {t('filters.statusProgress')}
      </h3>

      {showSeriesStatus && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {t('filters.seriesStatus')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SERIES_STATUS_UI.map(({ value, labelKey, sublabelKey }) => {
              const active     = filters.seriesStatuses.includes(value);
              const count      = allItems.filter((i) => i._status === value).length;
              const StatusIcon = SERIES_STATUS_ICONS[value];
              if (count === 0) return null;
              return (
                <button key={value} onClick={() => toggleStatus(value)}
                  className={`flex flex-col items-start px-3 py-2 rounded-full text-sm font-medium transition-colors min-w-[110px] border ${
                    active 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-transparent text-text-secondary border-[var(--color-border)] hover:bg-white/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <StatusIcon size={13} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-xs mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>
                    {t(sublabelKey)} · {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {profileActive ? (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {t('filters.myProgress')}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {USER_STATUS_UI.map(({ value, labelKey, sublabelKey }) => {
              const active       = filters.userStatuses.includes(value);
              const count        = allItems.filter((i) => i._userStatus === value).length;
              const ProgressIcon = USER_STATUS_ICONS[value];
              return (
                <button key={value} onClick={() => toggleUserStatus(value)}
                  className={`flex flex-col items-start px-3 py-2 rounded-full text-sm font-medium transition-colors min-w-[130px] border ${
                    active 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-transparent text-text-secondary border-[var(--color-border)] hover:bg-white/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ProgressIcon size={13} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-text-muted'}`}>
                    {t(sublabelKey)} · {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mini progress bars if "In progress" active */}
          {filters.userStatuses.includes('in_progress') && (() => {
            const inProgressItems = allItems
              .filter((i) => i._userStatus === 'in_progress')
              .sort((a, b) => b._userProgress - a._userProgress)
              .slice(0, 8);
            if (inProgressItems.length === 0) return null;
            return (
              <div className="flex flex-col gap-2 mt-1 max-h-[160px] overflow-y-auto pr-1">
                {inProgressItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-[13px] text-white/50 truncate flex-1 max-w-[140px]">
                      {item.title ?? item.name}
                    </span>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-[width]"
                        style={{ width: `${item._userProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/30 w-8 text-right font-mono">
                      {item._userProgress}%
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <UserRound size={16} className="text-white/45" />
          <span className="text-xs text-white/40 italic">
            {t('filters.signInPrompt')}
          </span>
        </div>
      )}
    </section>
  );
};

