// heroSectionParts.tsx — Sub-components for HeroSection
// Extracted to keep HeroSection under 300 lines (AGENTS.md Rule 4)

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Rating → color coding
export function ratingColor(r: number): string {
  if (r >= 7.5) return 'var(--color-success)';
  if (r >= 6)   return 'var(--color-warning)';
  return 'var(--color-danger)';
}

// Compact vote count: 12400 → "12.4k"
export function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── Metadata badges (rating · year · runtime · genres) ──────────────────────

interface HeroMetaBadgesProps {
  visible: boolean;
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
  visible, ratingStr, rating, voteCount, year, runtime, isSeries, seasons, genreNames,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {ratingStr && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{
            background: `${ratingColor(rating)}22`,
            border:     `1px solid ${ratingColor(rating)}55`,
            color:      ratingColor(rating),
          }}
        >
          <Star size={11} className="fill-current" />
          {ratingStr}
          {voteCount > 0 && (
            <span className="opacity-60 font-normal">({formatVotes(voteCount)})</span>
          )}
        </span>
      )}

      {(year || runtime || (isSeries && seasons)) && ratingStr && (
        <span className="text-white/25 select-none">·</span>
      )}

      {year && <span className="text-white/75 text-sm font-medium">{year}</span>}

      {(runtime || (isSeries && seasons)) && (
        <>
          <span className="text-white/25 select-none">·</span>
          <span className="text-white/75 text-sm font-medium">
            {isSeries && seasons
              ? t('detail.seasons', { count: seasons })
              : runtime}
          </span>
        </>
      )}

      {genreNames.length > 0 && (
        <>
          <span className="text-white/25 select-none">·</span>
          <div className="flex flex-wrap gap-1.5">
            {genreNames.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white/70 bg-white/10 backdrop-blur-sm border border-white/10"
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

// ── Action buttons (Play · My List · Sources) ───────────────────────────────

interface HeroActionsProps {
  visible: boolean;
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
  visible, accent, accentColor,
  isFavorite, isAddingToList, isPlayLoading,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const { t } = useTranslation();

  const playGlow = accentColor
    ? { boxShadow: `0 0 28px 4px ${accentColor}55, 0 4px 20px rgba(0,0,0,0.5)` }
    : {};

  return (
    <div
      className="flex flex-wrap gap-3"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {/* Play — accent + glow */}
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlayLoading}
        className="group relative h-13 rounded-2xl px-8 overflow-hidden flex items-center gap-3 font-bold text-base text-white active:scale-[0.96] transition-[transform,opacity,background-color] duration-200 disabled:opacity-60"
        style={{ background: accentColor ?? 'var(--color-accent)', ...playGlow }}
        onMouseEnter={e => {
          if (accentColor)
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              `0 0 42px 8px ${accentColor}77, 0 6px 28px rgba(0,0,0,0.6)`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = playGlow.boxShadow ?? '';
        }}
      >
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-600 ease-in-out pointer-events-none" />
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
        className="h-13 rounded-2xl px-6 flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 text-white/90 font-medium text-sm hover:bg-white/20 active:scale-[0.96] transition-[transform,opacity,background-color] duration-200 disabled:opacity-60"
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
        className="h-13 w-13 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 text-white/60 hover:text-white hover:bg-white/20 active:scale-[0.96] transition-[transform,opacity,background-color] duration-200"
      >
        <Download size={19} />
      </button>
    </div>
  );
};

