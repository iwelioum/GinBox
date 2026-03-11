// components/detail/InfoSection.tsx — Premium metadata section
// Clean rating display, metadata pills, expandable synopsis, additional info grid

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface InfoSectionProps {
  item:  CatalogMeta;
  theme: GenreTheme;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ item, theme: _theme }) => {
  const { t } = useTranslation();

  const overview = item.overview || item.description;
  const director = item.director;
  const studio = item.studio;
  const language = item.original_language;
  const country = Array.isArray(item.origin_country) ? item.origin_country[0] : undefined;

  const LANGUAGE_NAMES: Record<string, string> = {
    en: t('detail.langEnglish'), fr: t('detail.langFrench'), ja: t('detail.langJapanese'),
    ko: t('detail.langKorean'), es: t('detail.langSpanish'), de: t('detail.langGerman'),
    it: t('detail.langItalian'), pt: t('detail.langPortuguese'), zh: t('detail.langChinese'),
    ru: t('detail.langRussian'), ar: t('detail.langArabic'), hi: 'Hindi',
  };

  if (!overview && !director && !studio) return null;

  return (
    <section className="space-y-6">
      {/* Additional metadata — premium grid */}
      {(director || studio || country || language) && (
        <div className="flex flex-wrap gap-x-8 gap-y-3 py-5
                        border-t border-b border-[var(--color-border)]">
          {director && (
            <MetaItem label={t('detail.director')} value={director} />
          )}
          {studio && (
            <MetaItem label={t('detail.studio')} value={studio} />
          )}
          {country && (
            <MetaItem label={t('detail.country')} value={country} />
          )}
          {language && (
            <MetaItem label={t('detail.language')} value={LANGUAGE_NAMES[language] ?? language.toUpperCase()} />
          )}
        </div>
      )}
    </section>
  );
};

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[var(--color-text-muted)] text-sm font-medium">{label}</span>
      <span className="text-[var(--color-text-secondary)] text-sm">{value}</span>
    </div>
  );
}
