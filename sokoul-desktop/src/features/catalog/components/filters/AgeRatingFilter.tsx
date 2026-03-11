import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { AgeRating, FilterSectionProps } from '../catalogFilterTypes';

export const AgeRatingFilter: React.FC<FilterSectionProps> = ({ filters, onChange }) => {
  const { t } = useTranslation();

  return (
    <section>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {t('filters.ageRating')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {(['all', '10+', '12+', '16+', '18+', 'nc'] as AgeRating[]).map((rating) => {
          const isAll  = rating === 'all';
          const active = isAll
            ? filters.selectedRatings.length === 0
            : filters.selectedRatings.includes(rating);
          const label  = isAll
            ? t('common.all')
            : rating === 'nc'
              ? t('filters.unrated')
              : rating;
          return (
            <button
              key={rating}
              onClick={() => {
                if (isAll) onChange({ ...filters, selectedRatings: [] });
                else onChange({
                  ...filters,
                  selectedRatings: filters.selectedRatings.includes(rating)
                    ? filters.selectedRatings.filter((r) => r !== rating)
                    : [...filters.selectedRatings, rating],
                });
              }}
              className={`text-sm px-3 py-1.5 rounded-full transition-colors duration-200 ${
                active
                  ? 'bg-accent text-white font-medium'
                  : 'bg-transparent text-text-secondary border border-[var(--color-border)] hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
