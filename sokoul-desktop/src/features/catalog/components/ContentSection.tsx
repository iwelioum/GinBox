// ContentSection.tsx — A single editorial rail (genre / category section with horizontal scroll)

import * as React from 'react';
import { useTranslation }  from 'react-i18next';
import type { LucideIcon }    from 'lucide-react';
import type { PlaybackEntry } from '@/shared/types';
import type { EnrichedItem }  from '@/features/catalog/components/CatalogFilters';
import { EditorialCard }      from './EditorialCard';

interface ContentSectionProps {
  title:           string;
  subtitle:        string;
  icon?:           LucideIcon;
  accentColor?:    string;
  items:           EnrichedItem[];
  showProgress?:   boolean;
  onOpen:          (item: EnrichedItem) => void;
  playbackLookup?: Map<string, PlaybackEntry>;
}

export function ContentSection({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  items,
  showProgress = false,
  onOpen,
  playbackLookup,
}: ContentSectionProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;
  const sectionId = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2.5">
          {accentColor ? (
            <div
              style={{
                width: 4, height: 36, borderRadius: 2, flexShrink: 0,
                background: accentColor,
                boxShadow: `0 0 12px ${accentColor}88, 0 0 24px ${accentColor}44`,
              }}
            />
          ) : Icon ? (
            <span className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center">
              <Icon size={16} className="text-white/80" />
            </span>
          ) : null}
          <div>
            <h2
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: 'clamp(13px, 1.4vw, 18px)', fontWeight: 800,
                letterSpacing: '-0.025em', color: 'rgba(249,249,249,0.95)',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '11px', fontStyle: 'italic',
                  color: accentColor ? `${accentColor}cc` : 'rgba(249,249,249,0.40)',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="text-[13px] text-white/30 font-mono">
          {t('catalog.titlesCount', { count: items.length })}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {items.slice(0, 25).map((item) => (
          <EditorialCard
            key={`${sectionId}-${item.id}`}
            item={item}
            sectionId={sectionId}
            showProgress={showProgress}
            onOpen={onOpen}
            playbackEntry={playbackLookup?.get(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
