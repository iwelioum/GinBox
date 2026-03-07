import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tv, UserRound } from 'lucide-react';
import {
  getLangMeta,
  getCountryMeta,
  COUNTRY_VISIBLE_LIMIT,
} from '../catalogFilterConstants';
import type { EnrichedItem, FilterSectionProps } from '../catalogFilterTypes';

interface LanguageCountryFilterProps extends FilterSectionProps {
  langCountryItems: EnrichedItem[];
}

export const LanguageCountryFilter: React.FC<LanguageCountryFilterProps> = ({
  langCountryItems, filters, onChange,
}) => {
  const { t } = useTranslation();
  const [showAllCountries, setShowAllCountries] = React.useState(false);

  const availableLangs = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of langCountryItems) {
      if (item._lang !== 'unknown') counts.set(item._lang, (counts.get(item._lang) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, count, ...getLangMeta(code) }));
  }, [langCountryItems]);

  const availableCountries = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of langCountryItems) {
      for (const code of item._countries) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, count, ...getCountryMeta(code) }));
  }, [langCountryItems]);

  const displayedCountries = React.useMemo(() => {
    if (showAllCountries) return availableCountries;
    const top    = availableCountries.slice(0, COUNTRY_VISIBLE_LIMIT);
    const topSet = new Set(top.map((c) => c.code));
    const extras = filters.countries
      .filter((c) => !topSet.has(c))
      .map((code) => availableCountries.find((ac) => ac.code === code) ?? { code, count: 0, ...getCountryMeta(code) });
    return [...top, ...extras];
  }, [availableCountries, showAllCountries, filters.countries]);

  const hasMoreCountries = availableCountries.length > COUNTRY_VISIBLE_LIMIT;

  const toggleLang = (l: string) =>
    onChange({
      ...filters,
      originalLanguages: filters.originalLanguages.includes(l)
        ? filters.originalLanguages.filter((x) => x !== l)
        : [...filters.originalLanguages, l],
    });

  const toggleCountry = (c: string) =>
    onChange({
      ...filters,
      countries: filters.countries.includes(c)
        ? filters.countries.filter((x) => x !== c)
        : [...filters.countries, c],
    });

  if (availableLangs.length <= 1 && availableCountries.length === 0) return null;

  return (
    <section>
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
        {t('filters.languageCountry')}
      </h3>

      {availableLangs.length > 1 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.originalLanguage')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableLangs.map(({ code, labelKey, count }) => {
              const active = filters.originalLanguages.includes(code);
              return (
                <button key={code} onClick={() => toggleLang(code)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10">
                    <Tv size={10} />
                  </span>
                  <span>{t(labelKey)}</span>
                  <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableCountries.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            {t('filters.productionCountry')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {displayedCountries.map(({ code, labelKey, count }) => {
              const active = filters.countries.includes(code);
              return (
                <button key={code} onClick={() => toggleCountry(code)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    active ? 'bg-white text-black border-white font-semibold' : 'bg-transparent text-white/55 border-white/20 hover:border-white/50 hover:text-white/80'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10">
                    <UserRound size={10} />
                  </span>
                  <span>{t(labelKey)}</span>
                  <span className={`font-mono text-[10px] ${active ? 'text-black/50' : 'text-white/30'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          {hasMoreCountries && (
            <button onClick={() => setShowAllCountries((v) => !v)}
              className="mt-2 text-[11px] text-white/35 hover:text-white/70 transition-colors"
            >
              {showAllCountries
                ? t('common.showLess')
                : t('common.showMoreCount', { count: availableCountries.length - COUNTRY_VISIBLE_LIMIT })}
            </button>
          )}
        </div>
      )}
    </section>
  );
};
