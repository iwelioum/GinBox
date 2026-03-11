import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GlassPanel, SectionHeader, CinematicButton } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import { useNavigate } from 'react-router-dom';
import type { CollectionDetail } from '@/shared/types/index';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface CollectionUniverseProps {
  collection?: CollectionDetail | null;
  currentId?: string;
}

export function CollectionUniverse({ collection, currentId }: CollectionUniverseProps) {
  const navigate = useNavigate();

  const parts = useMemo(() =>
    collection?.parts?.sort((a, b) => {
      const ya = a.year ?? (a.release_date ? new Date(a.release_date).getFullYear() : 9999);
      const yb = b.year ?? (b.release_date ? new Date(b.release_date).getFullYear() : 9999);
      return ya - yb;
    }) ?? [],
    [collection?.parts],
  );

  if (!collection || parts.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title={collection.name} subtitle={`${parts.length} titles in this collection`} />

        <motion.div
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {parts.map((part, i) => {
            const isCurrent = part.id === currentId;
            const poster = part.poster_path || part.poster;
            const title = part.title || part.name || '';
            const year = part.year ?? (part.release_date ? new Date(part.release_date).getFullYear() : null);

            return (
              <motion.button
                key={part.id}
                variants={fadeUp}
                onClick={() => !isCurrent && navigate(`/detail/movie/${part.id}`)}
                className={`
                  group flex-shrink-0 w-[140px] text-left rounded-xl
                  ${isCurrent ? 'ring-2 ring-[var(--color-accent)] opacity-100' : 'opacity-80 hover:opacity-100'}
                  transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]
                `}
                aria-label={title}
                aria-current={isCurrent ? 'true' : undefined}
              >
                {/* Number badge */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2">
                  {poster ? (
                    <img
                      src={buildTmdbImageUrl(poster, 'w342') ?? undefined}
                      alt={title}
                      sizes="140px"
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="w-full h-full shimmer" />
                  )}
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-sm font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{title}</p>
                {year && <p className="text-sm text-[var(--color-text-muted)]">{year}</p>}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
