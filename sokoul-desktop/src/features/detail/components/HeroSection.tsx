// components/detail/HeroSection.tsx
// Cinematic hero — Framer Motion stagger · accent glow · premium typography

import * as React from 'react';
import { ChevronDown, ChevronUp, Tv2, Film, Clock, Calendar, Star, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { CatalogMeta } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';
import { resolveLogoOrTitle } from '@/shared/utils/logoUtils';
import { HeroActions } from './heroSectionParts';

export interface HeroSectionProps {
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
  visible: { transition: { staggerChildren: 0.10, delayChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function ratingColor(r: number): string {
  if (r >= 7.5) return 'var(--color-success)';
  if (r >= 6) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  item, theme: _theme, logoUrl, backdropUrl: _backdropUrl,
  isFavorite = false, isAddingToList = false,
  isPlayLoading = false, accentColor,
  onPlay, onDownload, onToggleFavorite,
}) => {
  const { t } = useTranslation();
  const [synopsisExpanded, setSynopsisExpanded] = React.useState(false);

  const title = item.title || item.name || '';
  const year = (item.release_date || item.first_air_date || item.releaseInfo || '').toString().slice(0, 4);
  const runtime = item.runtime ? `${Math.floor(item.runtime / 60)}h${item.runtime % 60 > 0 ? ` ${item.runtime % 60}min` : ''}` : '';
  const rating = item.vote_average ?? 0;
  const ratingStr = rating > 0 ? rating.toFixed(1) : '';
  const voteCount = item.vote_count ?? 0;
  const genreNames = (item.genres ?? []).map(g => typeof g === 'string' ? g : (g as { name: string }).name);
  const isSeries = item.type === 'series' || item.type === 'tv';
  const seasons = item.number_of_seasons;
  const episodes = item.number_of_episodes;
  const tagline = item.tagline;
  const seriesStatus = item.status;
  const accent = accentColor ?? 'var(--color-accent)';
  const rc = ratingColor(rating);

  const genreIds = item.genre_ids ?? [];
  const identity = resolveLogoOrTitle(logoUrl ?? null, null, title, genreIds, 'hero');

  return (
    <section
      className="relative flex items-end"
      style={{ height: 'var(--detail-hero-height)', minHeight: 560, maxHeight: 920 }}
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-20 px-[var(--section-px)] pb-14 w-full max-w-[860px]"
      >
        {/* Content type + status badges */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold
                       tracking-[0.15em] uppercase backdrop-blur-sm border"
            style={{
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
              color: accent,
            }}
          >
            {isSeries ? <Tv2 size={11} /> : <Film size={11} />}
            {isSeries ? t('common.series') : t('common.movie')}
          </span>
          {isSeries && seriesStatus && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold
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
              className="max-w-[550px] min-w-[160px] w-[32vw] mb-3
                         drop-shadow-[var(--shadow-logo,0_8px_32px_rgba(0,0,0,0.8))]"
            />
          ) : (
            <h1
              className="mb-3 [text-wrap:balance] drop-shadow-[var(--shadow-title,0_4px_24px_rgba(0,0,0,0.7))]"
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
            <p className="text-[var(--color-text-muted)] italic text-[var(--text-body)] font-medium mb-4 max-w-lg leading-snug">
              &ldquo;{tagline}&rdquo;
            </p>
          )}
        </motion.div>

        {/* Meta line: rating · year · runtime · seasons · genres */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5">
          {/* Rating pill with visual gauge */}
          {ratingStr && (
            <span
              className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-lg text-sm font-bold
                         backdrop-blur-sm border"
              style={{
                background: `color-mix(in srgb, ${rc} 12%, transparent)`,
                borderColor: `color-mix(in srgb, ${rc} 25%, transparent)`,
                color: rc,
              }}
            >
              {/* Mini circular gauge */}
              <svg width="22" height="22" viewBox="0 0 22 22" className="flex-shrink-0"
                   role="img" aria-label={`${ratingStr}/10`}>
                <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="2" />
                <circle
                  cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${(rating / 10) * 56.5} 56.5`}
                  transform="rotate(-90 11 11)"
                />
              </svg>
              {ratingStr}
              {voteCount > 0 && (
                <span className="opacity-40 font-normal text-xs">({formatVotes(voteCount)})</span>
              )}
            </span>
          )}

          {year && (
            <>
              <span className="text-[var(--color-text-muted)] select-none text-xs">·</span>
              <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)] text-sm">
                <Calendar size={12} className="opacity-50" />{year}
              </span>
            </>
          )}

          {(runtime || (isSeries && seasons)) && (
            <>
              <span className="text-[var(--color-text-muted)] select-none text-xs">·</span>
              <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)] text-sm">
                {isSeries ? (
                  <><Layers size={12} className="opacity-50" />
                    {t('detail.seasons', { count: seasons })}
                    {episodes ? ` · ${episodes} ep.` : ''}
                  </>
                ) : (
                  <><Clock size={12} className="opacity-50" />{runtime}</>
                )}
              </span>
            </>
          )}

          {genreNames.length > 0 && (
            <>
              <span className="text-[var(--color-text-muted)] select-none text-xs">·</span>
              <div className="flex flex-wrap gap-1.5">
                {genreNames.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium
                               text-[var(--color-text-secondary)] bg-[var(--color-white-8)]
                               border border-[var(--color-border)]
                               transition-colors duration-200 hover:bg-[var(--color-white-12)]
                               hover:text-[var(--color-text-primary)]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Synopsis */}
        {item.overview && (
          <motion.div variants={fadeUp} className="mb-7 max-w-[640px]">
            <p
              className={`text-[var(--color-text-secondary)] text-[var(--text-body)] leading-relaxed
                         ${!synopsisExpanded ? 'line-clamp-2 md:line-clamp-3 lg:line-clamp-4 synopsis-mask' : ''}`}
            >
              {item.overview}
            </p>
            {item.overview.length > 180 && (
              <button
                type="button"
                onClick={() => setSynopsisExpanded(v => !v)}
                aria-expanded={synopsisExpanded}
                className="mt-2 flex items-center gap-1.5 text-[var(--color-text-muted)]
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
