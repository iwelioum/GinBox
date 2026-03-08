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
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {t('filters.ratingPopularity')}
      </h3>

      {/* TMDB Rating */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
          {t('filters.tmdbRating')}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {RATING_PRESETS.map(({ labelKey, min, color }) => {
            const active = filters.ratingMin === min;
            const count  = allItems.filter((i) => min === 0 ? true : (i._rating !== null && i._rating >= min)).length;
            return (
              <button key={min} onClick={() => onChange({ ...filters, ratingMin: min })}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${
                  active 
                    ? 'bg-accent text-white font-medium' 
                    : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
                }`}
              >
                <span className={active ? 'text-yellow-400' : color}>★</span>
                <span>{t(labelKey)}</span>
                <span className={`font-mono text-xs ${active ? 'text-white/70' : 'text-text-muted'}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-4">0</span>
          <input type="range" min={0} max={10} step={0.5}
            value={filters.ratingMin}
            onChange={(e) => onChange({ ...filters, ratingMin: parseFloat(e.target.value) })}
            className="flex-1" style={{ accentColor: 'var(--color-accent)' }}
          />
          <span className="text-xs text-text-muted w-12 text-right font-mono">
            {filters.ratingMin > 0 ? `≥ ${filters.ratingMin}` : t('common.all')}
          </span>
        </div>
        {filters.ratingMin > 0 && filters.votesMin === 0 && (
          <p className="text-xs text-yellow-500/80 mt-2 inline-flex items-center gap-1">
            <AlertTriangle size={12} />
            {t('filters.includesFewVotes')}
          </p>
        )}
      </div>

      {/* Rating reliability */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            {t('filters.ratingReliability')}
          </p>
          <span title={t('filters.reliabilityTooltip')} className="text-xs text-text-muted cursor-help">
            <Info size={12} />
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {VOTE_PRESETS.map(({ labelKey, min, tooltipKey }) => {
            const active = filters.votesMin === min;
            return (
              <button key={min} title={t(tooltipKey)} onClick={() => onChange({ ...filters, votesMin: min })}
                className={`text-sm px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  active 
                    ? 'bg-accent text-white font-medium' 
                    : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
                }`}
              >{t(labelKey)}</button>
            );
          })}
        </div>
      </div>

      {/* TMDB Popularity */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            {t('filters.tmdbPopularity')}
          </p>
          <span title={t('filters.popularityTooltip')} className="text-xs text-text-muted cursor-help">
            <Info size={12} />
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULARITY_PRESETS.map(({ labelKey, topN }) => {
            const active = filters.popularityTopN === topN;
            return (
              <button key={labelKey} onClick={() => onChange({ ...filters, popularityTopN: topN })}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-all duration-200 ${
                  active 
                    ? 'bg-accent text-white font-medium' 
                    : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
                }`}
              >
                {topN !== null && <Flame size={12} className={active ? 'text-white/80' : 'text-yellow-500'} />}
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
