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
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
        {t('filters.durationStructure')}
      </h3>

      {showMovieDuration && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.movieDuration')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ ...filters, movieRuntimeRange: null })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                filters.movieRuntimeRange === null ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
              }`}
            >{t('common.all')}</button>
            {MOVIE_RUNTIME_PRESETS.map(({ labelKey, sublabelKey, range }) => {
              const active = filters.movieRuntimeRange?.[0] === range[0] && filters.movieRuntimeRange?.[1] === range[1];
              const count  = allItems.filter((i) => i._movieRuntime !== null && i._movieRuntime >= range[0] && i._movieRuntime <= range[1]).length;
              return (
                <button key={labelKey} onClick={() => toggleRange('movieRuntimeRange', range)}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl transition-all min-w-[86px] border ${
                    active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>
                    {t(sublabelKey)} · {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSeriesDuration && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.numberOfSeasons')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ ...filters, seasonsRange: null })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                filters.seasonsRange === null ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
              }`}
            >{t('common.all')}</button>
            {SEASONS_PRESETS.map(({ labelKey, sublabelKey, range }) => {
              const active = filters.seasonsRange?.[0] === range[0] && filters.seasonsRange?.[1] === range[1];
              const count  = allItems.filter((i) => i._seasonCount !== null && i._seasonCount >= range[0] && i._seasonCount <= range[1]).length;
              return (
                <button key={labelKey} onClick={() => toggleRange('seasonsRange', range)}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl transition-all min-w-[86px] border ${
                    active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">
                    <Tv size={12} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>
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
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.episodeDuration')}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onChange({ ...filters, episodeRtRange: null })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                filters.episodeRtRange === null ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
              }`}
            >{t('common.all')}</button>
            {EPISODE_RUNTIME_PRESETS.map(({ labelKey, sublabelKey, range }) => {
              const active = filters.episodeRtRange?.[0] === range[0] && filters.episodeRtRange?.[1] === range[1];
              const count  = allItems.filter((i) => i._episodeRuntime !== null && i._episodeRuntime >= range[0] && i._episodeRuntime <= range[1]).length;
              return (
                <button key={labelKey} onClick={() => toggleRange('episodeRtRange', range)}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl transition-all min-w-[86px] border ${
                    active ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  <span className="text-xs font-medium inline-flex items-center gap-1.5">
                    <Clapperboard size={12} />
                    {t(labelKey)}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-black/50' : 'text-white/30'}`}>
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
