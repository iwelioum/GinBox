// components/detail/InfoSection.tsx — Rich metadata grid
// Semantic dl/dt/dd, hover highlight, visual hierarchy

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface InfoSectionProps {
  item:  CatalogMeta;
  theme: GenreTheme;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'Français', ja: '日本語', ko: '한국어',
  es: 'Español', de: 'Deutsch', it: 'Italiano', pt: 'Português',
  zh: '中文', ru: 'Русский', ar: 'العربية', hi: 'हिन्दी',
  tr: 'Türkçe', nl: 'Nederlands', pl: 'Polski', sv: 'Svenska',
  da: 'Dansk', no: 'Norsk', fi: 'Suomi', th: 'ไทย',
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ item, theme: _theme }) => {
  const { t } = useTranslation();
  const isSeries = item.type === 'series' || item.type === 'tv';
  const isMovie = !isSeries;

  const director = item.director;
  const studio = item.studio;
  const language = item.original_language;
  const country = Array.isArray(item.origin_country) ? item.origin_country[0] : undefined;
  const budget = isMovie ? item.budget : undefined;
  const revenue = isMovie ? item.revenue : undefined;
  const status = isSeries ? item.status : undefined;
  const totalEpisodes = item.number_of_episodes;
  const totalSeasons = item.number_of_seasons;

  const items: { label: string; value: string; accent?: boolean }[] = [];

  if (director) items.push({ label: t('detail.director'), value: director, accent: true });
  if (studio) items.push({ label: t('detail.studio'), value: studio });
  if (language) items.push({ label: t('detail.language'), value: LANGUAGE_NAMES[language] ?? language.toUpperCase() });
  if (country) items.push({ label: t('detail.country'), value: country });
  if (budget && budget > 0) items.push({ label: t('detail.budget'), value: formatCurrency(budget) });
  if (revenue && revenue > 0) items.push({ label: t('detail.boxOffice'), value: formatCurrency(revenue), accent: true });
  if (status && isSeries) items.push({ label: 'Status', value: status });
  if (totalSeasons && totalEpisodes && isSeries) {
    items.push({ label: 'Total', value: `${totalSeasons} ${t('detail.seasons', { count: totalSeasons })} · ${totalEpisodes} ep.` });
  }

  if (items.length === 0) return null;

  return (
    <section>
      <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-4 py-5
                      border-t border-b border-[var(--color-border)]">
        {items.map(({ label, value, accent }) => (
          <div key={label} className="space-y-1 rounded-lg px-2 py-1.5 -mx-2
                                      transition-colors duration-200 hover:bg-[var(--color-white-4)]">
            <dt className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-medium">
              {label}
            </dt>
            <dd className={`text-sm font-semibold leading-tight ${
              accent ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
            }`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
