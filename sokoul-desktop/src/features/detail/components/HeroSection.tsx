// components/detail/HeroSection.tsx
// Cinematic hero — Framer Motion stagger · accent glow · premium typography

import * as React from 'react';
import { ChevronDown, ChevronUp, Tv2, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';
import { resolveLogoOrTitle } from '@/shared/utils/logoUtils';
import { HeroMetaBadges, HeroActions } from './heroSectionParts';

interface HeroSectionProps {
  item:              CatalogMeta;
  theme:             GenreTheme;
  logoUrl?:          string;
  backdropUrl?:      string;
  isFavorite?:       boolean;
  isAddingToList?:   boolean;
  isPlayLoading?:    boolean;
  accentColor?:      string;
  onPlay?:           () => void;
  onDownload?:       () => void;
  onToggleFavorite?: () => void;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  item, theme: _theme, logoUrl, backdropUrl: _backdropUrl,
  isFavorite = false, isAddingToList = false,
  isPlayLoading = false, accentColor,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const { t } = useTranslation();
  const [synopsisExpanded, setSynopsisExpanded] = React.useState(false);

  const title        = item.title || item.name || '';
  const year         = (item.release_date || item.first_air_date || item.releaseInfo || '').toString().slice(0, 4);
  const runtime      = item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '';
  const rating       = item.vote_average ?? 0;
  const ratingStr    = rating > 0 ? rating.toFixed(1) : '';
  const voteCount    = item.vote_count ?? 0;
  const genreNames   = (item.genres ?? []).map(g => typeof g === 'string' ? g : (g as { name: string }).name);
  const isSeries     = item.type === 'series' || item.type === 'tv';
  const seasons      = item.number_of_seasons;
  const tagline      = item.tagline;
  const seriesStatus = item.status;
  const accent       = accentColor ?? 'var(--color-accent)';

  const genreIds = item.genre_ids ?? [];
  const identity = resolveLogoOrTitle(logoUrl ?? null, null, title, genreIds, 'hero');

  return (
    <section
      className="relative flex items-end"
      style={{ height: 'var(--detail-hero-height)', minHeight: 560, maxHeight: 920 }}
    >
      {/* Content container with stagger orchestration */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-20 px-[var(--section-px)] pb-16 w-full max-w-[900px]"
      >

        {/* Content type badge */}
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 mb-5">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                       tracking-[0.15em] uppercase backdrop-blur-sm border transition-colors duration-200"
            style={{
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
              color: accent,
            }}
          >
            {isSeries ? <Tv2 size={12} /> : <Film size={12} />}
            {isSeries ? t('common.series') : t('common.movie')}
          </span>
          {isSeries && seriesStatus && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold
                             tracking-wider uppercase bg-[var(--color-white-8)] backdrop-blur-sm
                             border border-[var(--color-border)] text-[var(--color-text-muted)]">
              {seriesStatus}
            </span>
          )}
        </motion.div>

        {/* Logo or title */}
        <motion.div variants={fadeUp}>
          {identity.kind === 'logo' ? (
            <img
              alt={title}
              src={identity.url}
              className="max-w-[600px] min-w-[180px] w-[34vw] mb-4
                         drop-shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <h1
              className="mb-4 [text-wrap:balance] drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
              style={{
                fontFamily: identity.style.fontFamily,
                fontSize: identity.style.fontSize,
                fontWeight: identity.style.fontWeight,
                letterSpacing: identity.style.letterSpacing,
                textTransform: identity.style.textTransform,
                fontStyle: identity.style.fontStyle,
                color: identity.style.color,
                lineHeight: 1.05,
              }}
            >
              {title}
            </h1>
          )}
          {tagline && (
            <p className="text-[var(--color-text-muted)] italic text-[0.9375rem] font-medium mb-5 max-w-lg leading-snug">
              {tagline}
            </p>
          )}
        </motion.div>

        {/* Meta badges */}
        <motion.div variants={fadeUp}>
          <HeroMetaBadges
            ratingStr={ratingStr} rating={rating} voteCount={voteCount}
            year={year} runtime={runtime} isSeries={isSeries} seasons={seasons}
            genreNames={genreNames}
          />
        </motion.div>

        {/* Synopsis */}
        {item.overview && (
          <motion.div variants={fadeUp} className="mb-8 max-w-[680px]">
            <div className="relative">
              <p
                className={`text-[var(--color-text-secondary)] text-[0.9375rem] leading-relaxed
                           ${!synopsisExpanded ? 'line-clamp-3 synopsis-mask' : ''}`}
              >
                {item.overview}
              </p>
            </div>
            {item.overview.length > 160 && (
              <button
                type="button"
                onClick={() => setSynopsisExpanded(v => !v)}
                className="mt-2.5 flex items-center gap-1.5 text-[var(--color-text-muted)]
                           hover:text-[var(--color-text-secondary)] text-sm font-medium
                           transition-colors group focus-visible:outline-none
                           focus-visible:text-[var(--color-accent)]"
              >
                {synopsisExpanded ? (
                  <><ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform" /> {t('common.showLess')}</>
                ) : (
                  <><ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" /> {t('common.showMore')}</>
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div variants={fadeUp}>
          <HeroActions
            accent={accent} accentColor={accentColor}
            isFavorite={isFavorite} isAddingToList={isAddingToList} isPlayLoading={isPlayLoading}
            onPlay={onPlay} onDownload={onDownload} onToggleFavorite={onToggleFavorite}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
