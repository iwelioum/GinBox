// heroSectionParts.tsx — Sub-components for HeroSection
// Extracted to keep HeroSection under 300 lines (AGENTS.md Rule 4)

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ratingColor(r: number): string {
  if (r >= 7.5) return 'var(--color-success)';
  if (r >= 6)   return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── Metadata badges ──────────────────────────────────────────────────────────

interface HeroMetaBadgesProps {
  ratingStr: string;
  rating: number;
  voteCount: number;
  year: string;
  runtime: string;
  isSeries: boolean;
  seasons?: number;
  genreNames: string[];
}

export const HeroMetaBadges: React.FC<HeroMetaBadgesProps> = ({
  ratingStr, rating, voteCount, year, runtime, isSeries, seasons, genreNames,
}) => {
  const { t } = useTranslation();
  const rc = ratingColor(rating);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
      {ratingStr && (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold
                     backdrop-blur-sm border transition-shadow duration-300
                     hover:shadow-[0_0_16px_var(--color-success)/20]"
          style={{
            background: `color-mix(in srgb, ${rc} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${rc} 30%, transparent)`,
            color: rc,
          }}
        >
          <Star size={12} className="fill-current" />
          {ratingStr}
          {voteCount > 0 && (
            <span className="opacity-50 font-normal text-xs">({formatVotes(voteCount)})</span>
          )}
        </span>
      )}

      {(year || runtime || (isSeries && seasons)) && ratingStr && (
        <span className="text-[var(--color-text-muted)] select-none">·</span>
      )}

      {year && <span className="text-[var(--color-text-secondary)] text-sm font-medium">{year}</span>}

      {(runtime || (isSeries && seasons)) && (
        <>
          <span className="text-[var(--color-text-muted)] select-none">·</span>
          <span className="text-[var(--color-text-secondary)] text-sm font-medium">
            {isSeries && seasons
              ? t('detail.seasons', { count: seasons })
              : runtime}
          </span>
        </>
      )}

      {genreNames.length > 0 && (
        <>
          <span className="text-[var(--color-text-muted)] select-none">·</span>
          <div className="flex flex-wrap gap-1.5">
            {genreNames.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-1 rounded-full text-xs font-medium
                           text-[var(--color-text-secondary)] bg-[var(--color-white-8)]
                           backdrop-blur-sm border border-[var(--color-border)]
                           transition-colors duration-200 hover:bg-[var(--color-white-12)]
                           hover:text-[var(--color-text-primary)]"
              >
                {genre}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Action buttons ───────────────────────────────────────────────────────────

interface HeroActionsProps {
  accent: string;
  accentColor?: string;
  isFavorite: boolean;
  isAddingToList: boolean;
  isPlayLoading: boolean;
  onPlay?: () => void;
  onDownload?: () => void;
  onToggleFavorite?: () => void;
}

export const HeroActions: React.FC<HeroActionsProps> = ({
  accent, accentColor,
  isFavorite, isAddingToList, isPlayLoading,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3">
      {/* Play — accent + glow + shine sweep */}
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlayLoading}
        className="group relative h-13 rounded-2xl px-8 overflow-hidden flex items-center gap-3
                   font-bold text-base text-white active:scale-[0.96]
                   transition-all duration-300 disabled:opacity-60
                   hover:shadow-[0_0_40px_8px] hover:brightness-110
                   focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
        style={{
          background: accentColor ?? 'var(--color-accent)',
          boxShadow: accentColor
            ? `0 0 24px 2px ${accentColor}44, 0 4px 16px rgba(0,0,0,0.4)`
            : '0 4px 16px rgba(0,0,0,0.4)',
          ['--tw-shadow-color' as string]: `${accentColor ?? 'var(--color-accent)'}55`,
        }}
      >
        {/* Shine sweep on hover */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                         bg-gradient-to-r from-transparent via-white/25 to-transparent
                         transition-transform duration-700 ease-in-out pointer-events-none" />
        {isPlayLoading ? (
          <Loader2 size={21} className="animate-spin flex-shrink-0" />
        ) : (
          <Play size={21} className="fill-current flex-shrink-0" />
        )}
        <span>{isPlayLoading ? t('detail.searching') : t('common.play')}</span>
      </button>

      {/* My List — frosted glass */}
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={isAddingToList}
        className="h-13 rounded-2xl px-6 flex items-center gap-2.5
                   bg-[var(--color-white-8)] backdrop-blur-xl
                   border border-[var(--color-border-medium)]
                   text-[var(--color-text-primary)]/90 font-medium text-sm
                   hover:bg-[var(--color-white-15)] hover:border-[var(--color-border-strong)]
                   active:scale-[0.96] transition-all duration-200 disabled:opacity-60
                   focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        {isAddingToList ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isFavorite ? (
          <Check size={18} style={{ color: accent }} />
        ) : (
          <Plus size={18} />
        )}
        <span>{isFavorite ? t('detail.inMyList') : t('detail.addToMyList')}</span>
      </button>

      {/* Sources — icon only */}
      <button
        type="button"
        onClick={onDownload}
        title={t('common.sources')}
        aria-label={t('common.sources')}
        className="h-13 w-13 rounded-2xl flex items-center justify-center
                   bg-[var(--color-white-8)] backdrop-blur-xl
                   border border-[var(--color-border-medium)]
                   text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                   hover:bg-[var(--color-white-15)] hover:border-[var(--color-border-strong)]
                   active:scale-[0.96] transition-all duration-200
                   focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        <Download size={19} />
      </button>
    </div>
  );
};

