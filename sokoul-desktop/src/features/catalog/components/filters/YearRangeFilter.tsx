import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { YEAR_MIN, YEAR_MAX } from '../catalogFilterTypes';
import type { FilterSectionProps } from '../catalogFilterTypes';
import { DECADE_PRESETS } from '../catalogFilterConstants';
import { DualRangeSlider } from './DualRangeSlider';

export const YearRangeFilter: React.FC<FilterSectionProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();

  const isDefaultYear =
    filters.yearRange[0] === YEAR_MIN && filters.yearRange[1] === YEAR_MAX;

  const applyPreset = (range: [number, number]) => {
    const isCurrent = filters.yearRange[0] === range[0] && filters.yearRange[1] === range[1];
    onChange({ ...filters, yearRange: isCurrent ? [YEAR_MIN, YEAR_MAX] : range });
  };

  return (
    <section>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
        {t('filters.releasePeriod')}
      </h3>
      <DualRangeSlider value={filters.yearRange} onChange={(r) => onChange({ ...filters, yearRange: r })} />
      <div className="flex justify-between text-[11px] text-white/40 mt-2 mb-3 font-mono">
        <span>{filters.yearRange[0]}</span>
        <span>{filters.yearRange[1] === YEAR_MAX ? t('common.today') : filters.yearRange[1]}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => onChange({ ...filters, yearRange: [YEAR_MIN, YEAR_MAX] })}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
            isDefaultYear ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
          }`}
        >{t('common.all')}</button>
        {DECADE_PRESETS.map(({ labelKey, range }) => {
          const active = filters.yearRange[0] === range[0] && filters.yearRange[1] === range[1];
          return (
            <button key={labelKey} onClick={() => applyPreset(range)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
              }`}
            >{t(labelKey)}</button>
          );
        })}
      </div>
    </section>
  );
};
