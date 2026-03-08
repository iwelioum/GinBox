// components/detail/HeroSection.tsx — Netflix 2025 × Infuse × Apple TV hero section
// Full-width backdrop with title overlay and premium action buttons

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface HeroSectionProps {
  item:              CatalogMeta;
  theme:             GenreTheme;
  logoUrl?:          string;
  isFavorite?:       boolean;
  isAddingToList?:   boolean;
  isPlayLoading?:    boolean;
  onPlay?:           () => void;
  onDownload?:       () => void;
  onToggleFavorite?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  item, theme: _theme, logoUrl,
  isFavorite = false, isAddingToList = false,
  isPlayLoading = false,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const { t } = useTranslation();
  const title = item.title || item.name || '';

  // Metadata
  const year = (item.release_date || item.first_air_date || item.releaseInfo || '').toString().slice(0, 4);
  const runtime = item.runtime
    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
    : '';
  const rating = item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : '';
  const genreNames: string[] = (item.genres ?? []).map(g =>
    typeof g === 'string' ? g : (g as { name: string }).name
  );

  return (
    <section className="h-[55vh] min-h-[400px] relative flex items-end">
      {/* Title and metadata overlaid on backdrop */}
      <div className="px-[var(--section-px)] pb-12 w-full z-20">
        {logoUrl ? (
          <img
            alt={title}
            src={logoUrl}
            className="max-w-[600px] min-w-[200px] w-[35vw] mb-6"
          />
        ) : (
          <h1 className="text-[var(--text-hero)] font-bold tracking-[-0.02em] text-white mb-6 
                         drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            {title}
          </h1>
        )}

        {/* Metadata chips */}
        {(year || runtime || rating || genreNames.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {year && (
              <span className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                               px-3 py-1 text-sm font-medium">
                {year}
              </span>
            )}
            {runtime && (
              <span className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                               px-3 py-1 text-sm font-medium">
                {runtime}
              </span>
            )}
            {rating && (
              <span className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                               px-3 py-1 text-sm font-medium">
                {rating}
              </span>
            )}
            {genreNames.slice(0, 3).map((genre) => (
              <span 
                key={genre}
                className="rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] 
                           px-3 py-1 text-sm font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Synopsis - 4 lines with expandable option */}
        {item.overview && (
          <p className="text-[var(--color-text-secondary)] text-[0.9375rem] leading-relaxed 
                        line-clamp-4 max-w-3xl mb-8">
            {item.overview}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Primary Play button */}
          <button
            type="button"
            onClick={onPlay}
            disabled={isPlayLoading}
            className="bg-[var(--color-accent)] text-white h-12 rounded-lg px-8 font-semibold text-base
                       flex items-center justify-center gap-3 hover:bg-[var(--color-accent-hover)]
                       transition-colors disabled:opacity-70"
          >
            {isPlayLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Play size={20} className="fill-current" />
            )}
            <span>{isPlayLoading ? t('detail.searching') : t('common.play')}</span>
          </button>

          {/* Secondary Add to List button */}
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isAddingToList}
            className="bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] 
                       h-12 rounded-lg px-8 flex items-center justify-center gap-3
                       hover:bg-white/10 transition-colors disabled:opacity-70"
          >
            {isFavorite ? <Check size={20} /> : <Plus size={20} />}
            <span>{t('detail.addToMyList')}</span>
          </button>

          {/* Sources button */}
          <button
            type="button"
            onClick={onDownload}
            className="bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] 
                       h-12 rounded-lg px-8 flex items-center justify-center gap-3
                       hover:bg-white/10 transition-colors"
          >
            <Download size={20} />
            <span>{t('common.sources')}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
