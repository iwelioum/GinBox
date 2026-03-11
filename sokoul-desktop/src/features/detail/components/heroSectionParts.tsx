// heroSectionParts.tsx — HeroActions sub-component for HeroSection
// Extracted to keep HeroSection under 300 lines (AGENTS.md Rule 4)

import * as React from 'react';
import { Play, Plus, Check, Download, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
        className="group relative h-12 rounded-2xl px-8 overflow-hidden flex items-center gap-3
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
          <Loader2 size={20} className="animate-spin flex-shrink-0" />
        ) : (
          <Play size={20} className="fill-current flex-shrink-0" />
        )}
        <span>{isPlayLoading ? t('detail.searching') : t('common.play')}</span>
      </button>

      {/* My List — frosted glass */}
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={isAddingToList}
        className="h-12 rounded-2xl px-5 flex items-center gap-2
                   bg-[var(--color-white-8)] backdrop-blur-xl
                   border border-[var(--color-border-medium)]
                   text-[var(--color-text-primary)]/90 font-medium text-sm
                   hover:bg-[var(--color-white-15)] hover:border-[var(--color-border-strong)]
                   active:scale-[0.96] transition-all duration-200 disabled:opacity-60
                   focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        {isAddingToList ? (
          <Loader2 size={17} className="animate-spin" />
        ) : isFavorite ? (
          <Check size={17} style={{ color: accent }} />
        ) : (
          <Plus size={17} />
        )}
        <span>{isFavorite ? t('detail.inMyList') : t('detail.addToMyList')}</span>
      </button>

      {/* Sources — icon only */}
      <button
        type="button"
        onClick={onDownload}
        title={t('common.sources')}
        aria-label={t('common.sources')}
        className="h-12 w-12 rounded-2xl flex items-center justify-center
                   bg-[var(--color-white-8)] backdrop-blur-xl
                   border border-[var(--color-border-medium)]
                   text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
                   hover:bg-[var(--color-white-15)] hover:border-[var(--color-border-strong)]
                   active:scale-[0.96] transition-all duration-200
                   focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
      >
        <Download size={18} />
      </button>
    </div>
  );
};

