// ContentRail.tsx — Horizontal scroll rail with chevron navigation
//
// Chevron arrows appear on rail hover (group/rail), gradient-fade edges.
// Title with border-left accent · optional "See all" link via seeMoreHref.

import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CatalogMeta } from '@/shared/types';
import { ContentCard }      from './ContentCard';

// -- Types -------------------------------------------------------------------

interface ContentRailProps {
  title:        string;
  tagline?:     string;
  items:        CatalogMeta[];
  cardVariant?: 'poster' | 'landscape';
  isTop10?:     boolean;
  seeMoreHref?: string;
  Icon?:        LucideIcon;
  accentColor?: string;
  isFeatured?:  boolean;
  emoji?:       string;
  className?:   string;
}

// -- Constants ----------------------------------------------------------------

const SCROLL_RATIO = 0.85;

// -- Component ----------------------------------------------------------------

const ContentRail: React.FC<ContentRailProps> = ({
  title,
  items,
  cardVariant = 'landscape',
  accentColor = 'var(--color-accent)',
  seeMoreHref,
  className,
}) => {
  const { t } = useTranslation();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft]   = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateArrows = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items, updateArrows]);

  const scroll = React.useCallback((dir: 1 | -1) => {
    trackRef.current?.scrollBy({
      left: dir * (trackRef.current?.clientWidth ?? 0) * SCROLL_RATIO,
      behavior: 'smooth',
    });
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className={`group/rail relative mb-9 ${className ?? ''}`}>
      {/* Header — title + optional "See all" link */}
      <div className="flex items-baseline justify-between mb-3.5">
        <h3
          className="text-dp-text text-[17px] font-bold tracking-[0.4px] pl-2.5 leading-[1.3] m-0"
          style={{ borderLeft: `3px solid ${accentColor}` }}
        >
          {title}
        </h3>

        {seeMoreHref && (
          <NavLink
            to={seeMoreHref}
            className="text-sm text-[var(--color-text-secondary)]
                       hover:text-[var(--color-text-primary)]
                       tracking-[0.3px] no-underline
                       transition-colors duration-[var(--transition-fast)]"
          >
            {t('common.seeAll')} ›
          </NavLink>
        )}
      </div>

      {/* Scroll container + chevron arrows */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            aria-label={t('common.scrollLeft')}
            className="absolute left-0 top-0 bottom-0 z-10 w-10
                       flex items-center justify-center cursor-pointer border-none
                       bg-gradient-to-r from-[var(--color-bg-base)] to-transparent
                       opacity-0 group-hover/rail:opacity-100
                       transition-opacity duration-[var(--transition-base)]"
          >
            <ChevronLeft className="w-6 h-6 text-white/80" />
          </button>
        )}

        {/* Track */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto pb-1.5 scroll-smooth scrollbar-hide"
        >
          {items.map((item) => (
            <ContentCard key={item.id} item={item} variant={cardVariant} />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            aria-label={t('common.scrollRight')}
            className="absolute right-0 top-0 bottom-0 z-10 w-10
                       flex items-center justify-center cursor-pointer border-none
                       bg-gradient-to-l from-[var(--color-bg-base)] to-transparent
                       opacity-0 group-hover/rail:opacity-100
                       transition-opacity duration-[var(--transition-base)]"
          >
            <ChevronRight className="w-6 h-6 text-white/80" />
          </button>
        )}
      </div>
    </section>
  );
};

export { ContentRail };
