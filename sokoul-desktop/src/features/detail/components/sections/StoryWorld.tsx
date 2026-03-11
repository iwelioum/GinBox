import { useState, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/shared/components/ui';
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Synopsis */}
          <div className="lg:col-span-3">
            <SectionHeader title="Story" />
            {synopsis && (
              <>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={synopsisExpanded ? 'full' : 'short'}
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm text-[var(--color-text-secondary)] leading-relaxed ${synopsisExpanded ? '' : 'line-clamp-4'}`}
                  >
                    {synopsis}
                  </motion.p>
                </AnimatePresence>
                {synopsis.length > 200 && (
                  <button
                    onClick={() => setSynopsisExpanded(v => !v)}
                    className="text-sm text-[var(--color-accent)] mt-3 hover:underline transition-colors"
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
                    className="px-3 py-1 rounded-full border border-[var(--color-border)] text-sm bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick info */}
          <div className="lg:col-span-2">
            <SectionHeader title="Details" />
            <dl className="space-y-3">
              {item?.director && (
                <div className="flex items-center gap-2">
                  <dt className="text-sm text-[var(--color-text-muted)] w-24">Director</dt>
                  <dd className="text-sm font-medium text-[var(--color-text-primary)]">{item.director}</dd>
                </div>
              )}
              {item?.studio && (
                <div className="flex items-center gap-2">
                  <dt className="text-sm text-[var(--color-text-muted)] w-24">Studio</dt>
                  <dd className="text-sm font-medium text-[var(--color-text-primary)]">{item.studio}</dd>
                </div>
              )}
              {item?.status && (
                <div className="flex items-center gap-2">
                  <dt className="text-sm text-[var(--color-text-muted)] w-24">Status</dt>
                  <dd className="text-sm font-medium text-[var(--color-text-primary)]">{item.status}</dd>
                </div>
              )}
              {item?.original_language && (
                <div className="flex items-center gap-2">
                  <dt className="text-sm text-[var(--color-text-muted)] w-24">Language</dt>
                  <dd className="text-sm font-medium text-[var(--color-text-primary)]">{item.original_language.toUpperCase()}</dd>
                </div>
              )}
              {item?.runtime && (
                <div className="flex items-center gap-2">
                  <dt className="text-sm text-[var(--color-text-muted)] w-24">Runtime</dt>
                  <dd className="text-sm font-medium text-[var(--color-text-primary)]">{item.runtime} min</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
