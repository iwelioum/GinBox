// components/detail/InfoSection.tsx — Netflix 2025 × Infuse × Apple TV info section
// Rating badges, metadata, expandable synopsis, and cast carousel

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
  const [synopsisExpanded, setSynopsisExpanded] = React.useState(false);

  const title = item.title || item.name || '';
  const overview = item.overview || item.description;
  const voteAvg = item.vote_average;
  const voteCount = item.vote_count;
  const runtime = item.runtime;
  const year = item.release_date
    ? new Date(item.release_date).getFullYear()
    : (item.releaseInfo || item.year);
  const status = item.status;
  const language = item.original_language;
  const country = Array.isArray(item.origin_country) ? item.origin_country[0] : undefined;
  const director = item.director;
  const studio = item.studio;

  const genreList: string[] = Array.isArray(item.genres)
    ? item.genres.map(g => typeof g === 'string' ? g : g.name ?? '').filter(Boolean)
    : [];

  // Early return if no meaningful content
  if (!overview && !voteAvg && genreList.length === 0 && !director && !studio) return null;

  const formatRuntime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}min` : ''}` : `${m}min`;
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    en: t('detail.langEnglish'), fr: t('detail.langFrench'), ja: t('detail.langJapanese'), 
    ko: t('detail.langKorean'), es: t('detail.langSpanish'), de: t('detail.langGerman'), 
    it: t('detail.langItalian'), pt: t('detail.langPortuguese'), zh: t('detail.langChinese'), 
    ru: t('detail.langRussian'), ar: t('detail.langArabic'), hi: 'Hindi',
  };

  return (
    <section className="space-y-8">
      {/* Rating and metadata row */}
      {(voteAvg || year || runtime || status) && (
        <div className="flex flex-wrap items-center gap-4">
          {/* IMDb/TMDB Rating Badge */}
          {voteAvg && voteAvg > 0 && (
            <div className="bg-[var(--color-bg-elevated)] rounded-lg px-4 py-2 flex items-center gap-2">
              <span className="text-yellow-400 text-lg">★</span>
              <div className="flex flex-col">
                <span className="text-[var(--color-text-primary)] font-semibold text-lg leading-none">
                  {voteAvg.toFixed(1)}
                </span>
                <span className="text-[var(--color-text-muted)] text-xs leading-none">
                  {voteCount ? t('detail.votes', { count: voteCount }).replace('{{count}}', voteCount.toLocaleString()) : 'TMDB'}
                </span>
              </div>
            </div>
          )}

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2">
            {year && (
              <span className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                               px-3 py-1 text-sm">
                {year}
              </span>
            )}
            {runtime && runtime > 0 && (
              <span className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                               px-3 py-1 text-sm">
                {formatRuntime(runtime)}
              </span>
            )}
            {genreList.length > 0 && (
              <span className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                               px-3 py-1 text-sm">
                {genreList[0]}
              </span>
            )}
            {status === 'returning' && (
              <span className="rounded-full bg-green-400/20 text-green-400 px-3 py-1 text-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {t('common.ongoing')}
              </span>
            )}
            {status === 'ended' && (
              <span className="rounded-full bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)] 
                               px-3 py-1 text-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                {t('common.ended')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Synopsis with expandable option */}
      {overview && (
        <div className="space-y-3">
          <div className={`text-[var(--color-text-secondary)] text-[0.9375rem] leading-relaxed 
                          ${synopsisExpanded ? '' : 'line-clamp-4'}`}>
            {overview}
          </div>
          {overview.length > 300 && (
            <button
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              className="text-[var(--color-accent)] text-sm font-medium hover:text-[var(--color-accent-hover)] 
                         transition-colors"
            >
              {synopsisExpanded ? 'Lire moins' : 'Lire plus'}
            </button>
          )}
        </div>
      )}

      {/* Additional metadata */}
      {(director || studio || country || language) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-t border-[var(--color-border)]">
          {director && (
            <div className="flex gap-2">
              <span className="text-[var(--color-text-muted)] font-medium min-w-0">{t('detail.director')}</span>
              <span className="text-[var(--color-text-secondary)]">{director}</span>
            </div>
          )}
          {studio && (
            <div className="flex gap-2">
              <span className="text-[var(--color-text-muted)] font-medium min-w-0">{t('detail.studio')}</span>
              <span className="text-[var(--color-text-secondary)]">{studio}</span>
            </div>
          )}
          {country && (
            <div className="flex gap-2">
              <span className="text-[var(--color-text-muted)] font-medium min-w-0">{t('detail.country')}</span>
              <span className="text-[var(--color-text-secondary)]">{country}</span>
            </div>
          )}
          {language && (
            <div className="flex gap-2">
              <span className="text-[var(--color-text-muted)] font-medium min-w-0">{t('detail.language')}</span>
              <span className="text-[var(--color-text-secondary)]">
                {LANGUAGE_NAMES[language] ?? language.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
