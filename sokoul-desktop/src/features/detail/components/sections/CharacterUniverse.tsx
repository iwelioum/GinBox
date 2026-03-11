import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import type { Credits, CastMember } from '@/shared/types/index';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const MAX_VISIBLE = 20;

interface CharacterUniverseProps {
  credits?: Credits;
  isLoading?: boolean;
}

export function CharacterUniverse({ credits, isLoading }: CharacterUniverseProps) {
  const [showAll, setShowAll] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const cast = useMemo(() => {
    const all = credits?.cast ?? [];
    return showAll ? all : all.slice(0, MAX_VISIBLE);
  }, [credits?.cast, showAll]);

  const totalCast = credits?.cast?.length ?? 0;

  if (!isLoading && totalCast === 0) return null;

  return (
    <section className="relative px-16 py-16">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader
          title="Cast"
          subtitle={`${totalCast} actor${totalCast !== 1 ? 's' : ''}`}
          action={totalCast > MAX_VISIBLE && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-sm text-[var(--color-accent)] hover:underline transition-colors"
            >
              {showAll ? 'Show less' : `View all ${totalCast}`}
            </button>
          )}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] rounded-xl shimmer" />
                <div className="h-4 w-3/4 shimmer rounded mt-2" />
                <div className="h-3 w-1/2 shimmer rounded mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {cast.map((member: CastMember) => (
              <CastCard key={member.id} member={member} prefersReducedMotion={!!prefersReducedMotion} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function CastCard({ member, prefersReducedMotion }: { member: CastMember; prefersReducedMotion: boolean }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div variants={fadeUp} className="group">
      <div className="aspect-[2/3] rounded-xl overflow-hidden relative card-elevated">
        {member.profile_path ? (
          <>
            <img
              src={buildTmdbImageUrl(member.profile_path, 'w342') ?? undefined}
              alt={member.name}
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.06] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          </>
        ) : (
          <div className="w-full h-full bg-[var(--color-bg-overlay)] flex items-center justify-center">
            <span className="text-4xl text-[var(--color-text-muted)]">👤</span>
          </div>
        )}

        {/* Hover overlay with character info */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent
          flex flex-col justify-end p-4 transition-opacity duration-250
          ${prefersReducedMotion ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}>
          {member.character && (
            <p className="text-sm text-[var(--color-accent)] font-medium line-clamp-2">as {member.character}</p>
          )}
        </div>

        {/* Accent glow on hover */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[var(--color-accent)]/0 group-hover:bg-[var(--color-accent)]/20 blur-2xl rounded-full pointer-events-none transition-all duration-300" />
      </div>

      <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-3 truncate">{member.name}</p>
      <p className="text-sm text-[var(--color-text-muted)] truncate">{member.character || 'Unknown role'}</p>
    </motion.div>
  );
}
