// ContentRail.tsx — Exact replica of CategoryRow.js from Disney+ clone
//
// Horizontal scroll (flex, gap 12px, overflow-x auto, hidden scrollbar)
// Title with border-left 3px solid accent
// Interface preserved for compatibility with ActorPage, BrowsePage, etc.

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { CatalogMeta } from '@/shared/types';
import { ContentCard }      from './ContentCard';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const ContentRail: React.FC<ContentRailProps> = ({
  title,
  items,
  cardVariant = 'landscape',
  accentColor = '#0063e5',
  className,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className={`mb-9 ${className ?? ''}`}>
      {/* Title with left accent border — exact CategoryRow.js style */}
      <h3
        className="text-dp-text text-[17px] font-bold tracking-[0.4px] mb-3.5 pl-2.5 leading-[1.3]"
        style={{ borderLeft: `3px solid ${accentColor}` }}
      >
        {title}
      </h3>

      {/* Horizontal scroll track — exact CategoryRow.js ScrollTrack */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 scroll-smooth">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            variant={cardVariant}
          />
        ))}
      </div>
    </section>
  );
};

export { ContentRail };
