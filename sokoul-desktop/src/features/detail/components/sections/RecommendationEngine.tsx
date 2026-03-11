import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import { useNavigate } from 'react-router-dom';
import type { CatalogMeta } from '@/shared/types/index';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface RecommendationEngineProps {
  similar?: CatalogMeta[];
  contentType?: string;
}

export function RecommendationEngine({ similar, contentType }: RecommendationEngineProps) {
  const navigate = useNavigate();
  const items = similar?.slice(0, 12) ?? [];

  if (items.length === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader title="More Like This" subtitle="You might also enjoy" />

        <motion.div
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {items.map(item => (
            <PosterCard
              key={item.id}
              item={item}
              contentType={contentType}
              onClick={() => navigate(`/detail/${item.type || item.media_type || contentType || 'movie'}/${item.id}`)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PosterCard({ item, contentType, onClick }: { item: CatalogMeta; contentType?: string; onClick: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const posterPath = item.poster_path || item.poster;
  const title = item.title || item.name || '';
  const year = item.year ?? (item.release_date ? new Date(item.release_date).getFullYear() : null);
  const rating = item.vote_average;

  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      className="group flex-shrink-0 w-[160px] text-left focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-xl"
      aria-label={title}
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden relative mb-2 shadow-[var(--depth-base)] group-hover:shadow-[var(--depth-elevated)] transition-shadow duration-200">
        {posterPath ? (
          <>
            <img
              src={buildTmdbImageUrl(posterPath, 'w342') ?? undefined}
              alt={title}
              sizes="160px"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.05] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          </>
        ) : (
          <div className="w-full h-full bg-[var(--color-bg-overlay)] shimmer" />
        )}

        {/* Rating badge */}
        {rating != null && rating > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-sm font-medium text-[var(--color-text-primary)]">
            ⭐ {rating.toFixed(1)}
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{title}</p>
      {year && <p className="text-sm text-[var(--color-text-muted)]">{year}</p>}
    </motion.button>
  );
}
