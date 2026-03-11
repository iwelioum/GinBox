import { useState, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SectionHeader, GlassPanel } from '@/shared/components/ui';
import type { UseDetailDataResult } from '../../hooks/useDetailData';

export function StoryWorld({ data }: { data: UseDetailDataResult }) {
  const { item } = data;
  const prefersReducedMotion = useReducedMotion();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const synopsis = item?.overview || item?.description || '';
  const genres = useMemo(() =>
    (item?.genres ?? []).map(g => typeof g === 'string' ? g : g.name),
    [item?.genres],
  );

  if (!synopsis && genres.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Synopsis panel */}
          <GlassPanel className="lg:col-span-3 p-8 card-glow" as="article">
            <SectionHeader title="Story" />
            {synopsis && (
              <>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={synopsisExpanded ? 'full' : 'short'}
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm text-[var(--color-text-secondary)] leading-7 ${synopsisExpanded ? '' : 'line-clamp-4'}`}
                  >
                    {synopsis}
                  </motion.p>
                </AnimatePresence>
                {synopsis.length > 200 && (
                  <button
                    onClick={() => setSynopsisExpanded(v => !v)}
                    className="text-sm text-[var(--color-accent)] mt-4 hover:underline transition-colors font-medium"
                  >
                    {synopsisExpanded ? 'Show less ↑' : 'Read more ↓'}
                  </button>
                )}
              </>
            )}

            {/* Genre tags */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {genres.map(g => (
                  <span
                    key={g}
                    className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-sm bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)] transition-colors duration-200 cursor-default"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Quick metadata panel */}
          <GlassPanel className="lg:col-span-2 p-8 card-glow" as="aside">
            <SectionHeader title="Details" />
            <dl className="space-y-4">
              {[
                item?.director && { label: 'Director', value: item.director },
                item?.studio && { label: 'Studio', value: item.studio },
                item?.status && { label: 'Status', value: item.status },
                item?.original_language && { label: 'Language', value: item.original_language.toUpperCase() },
                item?.runtime && { label: 'Runtime', value: `${item.runtime} min` },
                item?.origin_country?.length && { label: 'Country', value: item.origin_country.join(', ') },
              ].filter(Boolean).map((field) => {
                const f = field as { label: string; value: string };
                return (
                  <div key={f.label} className="flex items-baseline gap-3 group">
                    <dt className="text-sm text-[var(--color-text-muted)] w-20 flex-shrink-0 group-hover:text-[var(--color-text-secondary)] transition-colors">{f.label}</dt>
                    <dd className="text-sm font-medium text-[var(--color-text-primary)]">{f.value}</dd>
                  </div>
                );
              })}
            </dl>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}
