// ContentRail.tsx — Exact replica of CategoryRow.js from Disney+ clone
//
// Horizontal scroll (flex, gap 12px, overflow-x auto, hidden scrollbar)
// Title with border-left 3px solid accent
// Interface conservée pour compatibilité avec ActorPage, BrowsePage, etc.

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

// ── Composant ─────────────────────────────────────────────────────────────────

const ContentRail: React.FC<ContentRailProps> = ({
  title,
  items,
  cardVariant = 'landscape',
  accentColor = '#0063e5',
  className,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section style={{ marginBottom: 36 }} className={className ?? ''}>
      {/* Title with left accent border — exact CategoryRow.js style */}
      <h3
        style={{
          color: '#f9f9f9',
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '0.4px',
          marginBottom: 14,
          paddingLeft: 10,
          borderLeft: `3px solid ${accentColor}`,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Horizontal scroll track — exact CategoryRow.js ScrollTrack */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
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
