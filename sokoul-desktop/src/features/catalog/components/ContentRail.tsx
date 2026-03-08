// ContentRail.tsx — Premium horizontal content rail with Netflix 2025 aesthetic

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
    <section className={`mb-10 ${className ?? ''}`}>
      {/* Premium section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[--color-text-primary] tracking-[-0.01em]">
          {title}
        </h2>
        <button className="text-sm text-[--color-text-secondary] hover:text-[--color-accent] transition-colors duration-200 font-medium">
          Voir tout →
        </button>
      </div>

      {/* Horizontal scroll rail with snap behavior */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
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
