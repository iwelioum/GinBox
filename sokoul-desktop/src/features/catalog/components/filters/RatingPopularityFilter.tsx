import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Flame, Info } from 'lucide-react';
import {
  RATING_PRESETS,
  VOTE_PRESETS,
  POPULARITY_PRESETS,
} from '../catalogFilterConstants';
import type { EnrichedItem, FilterSectionProps } from '../catalogFilterTypes';

interface RatingPopularityFilterProps extends FilterSectionProps {
  allItems: EnrichedItem[];
}

export const RatingPopularityFilter: React.FC<RatingPopularityFilterProps> = ({
  allItems, filters, onChange,
}) => {
  const { t } = useTranslation();

  return (
    <section>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
        {t('filters.ratingPopularity')}
      </h3>

      {/* TMDB Rating */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
          {t('filters.tmdbRating')}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {RATING_PRESETS.map(({ labelKey, min, color }) => {
            const active = filters.ratingMin === min;
            const count  = allItems.filter((i) => min === 0 ? true : (i._rating !== null && i._rating >= min)).length;
            return (
              <button key={min} onClick={() => onChange({ ...filters, ratingMin: min })}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                  active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >
                <span className={active ? 'text-yellow-500' : color}>★</span>
                <span>{t(labelKey)}</span>
                <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 w-4">0</span>
          <input type="range" min={0} max={10} step={0.5}
            value={filters.ratingMin}
            onChange={(e) => onChange({ ...filters, ratingMin: parseFloat(e.target.value) })}
            className="flex-1" style={{ accentColor: 'white' }}
          />
          <span className="text-[10px] text-white/40 w-10 text-right font-mono">
            {filters.ratingMin > 0 ? `≥ ${filters.ratingMin}` : t('common.all')}
          </span>
        </div>
        {filters.ratingMin > 0 && filters.votesMin === 0 && (
          <p className="text-[10px] text-amber-500/70 mt-1.5 inline-flex items-center gap-1">
            <AlertTriangle size={11} />
            {t('filters.includesFewVotes')}
          </p>
        )}
      </div>

      {/* Rating reliability */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
            {t('filters.ratingReliability')}
          </p>
          <span title={t('filters.reliabilityTooltip')} className="text-[10px] text-white/20 cursor-help">
            <Info size={11} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VOTE_PRESETS.map(({ labelKey, min, tooltipKey }) => {
            const active = filters.votesMin === min;
            return (
              <button key={min} title={t(tooltipKey)} onClick={() => onChange({ ...filters, votesMin: min })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 whitespace-nowrap ${
                  active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >{t(labelKey)}</button>
            );
          })}
        </div>
      </div>

      {/* TMDB Popularity */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
            {t('filters.tmdbPopularity')}
          </p>
          <span title={t('filters.popularityTooltip')} className="text-[10px] text-white/20 cursor-help">
            <Info size={11} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULARITY_PRESETS.map(({ labelKey, topN }) => {
            const active = filters.popularityTopN === topN;
            return (
              <button key={labelKey} onClick={() => onChange({ ...filters, popularityTopN: topN })}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                  active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >
                {topN !== null && <Flame size={12} className={active ? 'text-black/50' : 'text-yellow-500'} />}
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
