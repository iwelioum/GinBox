import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Clapperboard, Clock3, Tv } from 'lucide-react';
import {
  MOVIE_RUNTIME_PRESETS,
  SEASONS_PRESETS,
  EPISODE_RUNTIME_PRESETS,
} from '../catalogFilterConstants';
import type { EnrichedItem, FilterSectionProps } from '../catalogFilterTypes';

interface DurationStructureFilterProps extends FilterSectionProps {
  allItems: EnrichedItem[];
}

export const DurationStructureFilter: React.FC<DurationStructureFilterProps> = ({
  allItems, filters, onChange,
}) => {
  const { t } = useTranslation();

  const hasDurationData = React.useMemo(
    () => allItems.some((i) => i._movieRuntime !== null || i._seasonCount !== null || i._episodeRuntime !== null),
    [allItems],
  );

  const showMovieDuration =
    filters.kinds.length === 0 ||
    filters.kinds.some((k) => k === 'movie' || k === 'short' || k === 'documentary');

  const showSeriesDuration =
    filters.kinds.length === 0 ||
    filters.kinds.some((k) => k === 'tv' || k === 'anime' || k === 'animation' || k === 'miniseries' || k === 'reality');

  if (!hasDurationData || (!showMovieDuration && !showSeriesDuration)) return null;

  const toggleRange = (
    key: 'movieRuntimeRange' | 'seasonsRange' | 'episodeRtRange',
    range: [number, number],
  ) => {
    const current = filters[key];
    const isCurrent = current?.[0] === range[0] && current?.[1] === range[1];
    onChange({ ...filters, [key]: isCurrent ? null : range });
  };

  return (
    <section>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {t('filters.durationStructure')}
      </h3>

      {showMovieDuration && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {t('filters.movieDuration')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ ...filters, movieRuntimeRange: null })}
              className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.movieRuntimeRange === null 
                  ? 'bg-accent text-white font-medium' 
                  : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
              }`}
            >{t('common.all')}</button>
            {MOVIE_RUNTIME_PRESETS.map(({ labelKey, sublabelKey, range }) => {
              const active = filters.movieRuntimeRange?.[0] === range[0] && filters.movieRuntimeRange?.[1] === range[1];
              const count  = allItems.filter((i) => i._movieRuntime !== null && i._movieRuntime >= range[0] && i._movieRuntime <= range[1]).length;
              return (
                <button key={labelKey} onClick={() => toggleRange('movieRuntimeRange', range)}
                  className={`flex flex-col items-start px-3 py-2 rounded-full transition-all min-w-[86px] border ${
                    active 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-transparent text-text-secondary border-[var(--color-border)] hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-text-muted'}`}>
                    {t(sublabelKey)} · {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSeriesDuration && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {t('filters.numberOfSeasons')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ ...filters, seasonsRange: null })}
              className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.seasonsRange === null 
                  ? 'bg-accent text-white font-medium' 
                  : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
              }`}
            >{t('common.all')}</button>
            {SEASONS_PRESETS.map(({ labelKey, sublabelKey, range }) => {
              const active = filters.seasonsRange?.[0] === range[0] && filters.seasonsRange?.[1] === range[1];
              const count  = allItems.filter((i) => i._seasonCount !== null && i._seasonCount >= range[0] && i._seasonCount <= range[1]).length;
              return (
                <button key={labelKey} onClick={() => toggleRange('seasonsRange', range)}
                  className={`flex flex-col items-start px-3 py-2 rounded-full transition-all min-w-[86px] border ${
                    active 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-transparent text-text-secondary border-[var(--color-border)] hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">
                    <Tv size={12} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-text-muted'}`}>
                    {t(sublabelKey)} · {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSeriesDuration && (
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
            {t('filters.episodeDuration')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ ...filters, episodeRtRange: null })}
              className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.episodeRtRange === null 
                  ? 'bg-accent text-white font-medium' 
                  : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
              }`}
            >{t('common.all')}</button>
            {EPISODE_RUNTIME_PRESETS.map(({ labelKey, sublabelKey, range }) => {
              const active = filters.episodeRtRange?.[0] === range[0] && filters.episodeRtRange?.[1] === range[1];
              const count  = allItems.filter((i) => i._episodeRuntime !== null && i._episodeRuntime >= range[0] && i._episodeRuntime <= range[1]).length;
              return (
                <button key={labelKey} onClick={() => toggleRange('episodeRtRange', range)}
                  className={`flex flex-col items-start px-3 py-2 rounded-full transition-all min-w-[86px] border ${
                    active 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-transparent text-text-secondary border-[var(--color-border)] hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">
                    <Clapperboard size={12} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-text-muted'}`}>
                    {t(sublabelKey)} · {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
