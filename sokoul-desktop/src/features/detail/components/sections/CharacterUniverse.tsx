import { useRef, useCallback } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/shared/components/ui';
import { buildTmdbImageUrl } from '@/shared/utils/image';
import type { Credits, CastMember } from '@/shared/types/index';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CharacterUniverseProps {
  credits?: Credits;
  isLoading?: boolean;
}

// ─── Initials fallback ────────────────────────────────────────────────────────

function InitialsFallback({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.05))',
      }}
    >
      <span
        className="text-3xl font-semibold"
        style={{
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {initials}
      </span>
    </div>
  );
}

// ─── FeaturedActor ────────────────────────────────────────────────────────────

interface FeaturedActorProps {
  actor: CastMember;
  onClick: () => void;
}

function FeaturedActor({ actor, onClick }: FeaturedActorProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgSrc = buildTmdbImageUrl(actor.profile_path, 'w342') ?? undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex gap-6 mb-10 p-6 rounded-2xl cursor-pointer group"
      style={{ background: 'var(--color-bg-glass)' }}
      onClick={onClick}
    >
      <div className="w-[140px] flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden relative">
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={actor.name}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover object-top transition-opacity duration-200 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          </>
        ) : (
          <InitialsFallback name={actor.name} />
        )}
      </div>

      <div className="flex flex-col justify-end">
        <p
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color: 'var(--color-accent)' }}
        >
          Rôle principal
        </p>
        <h3
          className="text-2xl font-semibold tracking-tight mb-1 transition-colors duration-200 group-hover:text-white"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)',
          }}
        >
          {actor.name}
        </h3>
        {actor.character && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {actor.character}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── ActorCard ────────────────────────────────────────────────────────────────

interface ActorCardProps {
  member: CastMember;
  isSelected: boolean;
  onClick: () => void;
}

function ActorCard({ member, isSelected, onClick }: ActorCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgSrc = buildTmdbImageUrl(member.profile_path, 'w342') ?? undefined;

  return (
    <div
      className="group cursor-pointer w-[160px] flex-shrink-0"
      onClick={onClick}
    >
      <div
        className={`aspect-[2/3] rounded-2xl overflow-hidden relative ring-1 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-white/[0.15] ${
          isSelected
            ? 'ring-2 ring-[var(--color-accent)] scale-[0.98]'
            : 'ring-white/[0.06]'
        }`}
        style={{
          boxShadow: isSelected
            ? 'var(--depth-elevated)'
            : 'var(--depth-surface)',
        }}
      >
        {imgSrc ? (
          <>
            <img
              src={imgSrc}
              alt={member.name}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.07] ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!imgLoaded && <div className="absolute inset-0 shimmer" />}
          </>
        ) : (
          <InitialsFallback name={member.name} />
        )}

        {/* Internal vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55)' }}
        />

        {/* Permanent bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Slide-up character overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none">
          {member.character && (
            <p className="text-xs font-semibold text-white line-clamp-1">
              {member.character}
            </p>
          )}
        </div>
      </div>

      <p
        className="text-sm font-medium mt-3 line-clamp-1 transition-colors duration-200 group-hover:text-[var(--color-accent)]"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {member.name}
      </p>
      <p
        className="text-xs mt-0.5 line-clamp-1"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {member.character || '—'}
      </p>
    </div>
  );
}

// ─── CharacterUniverse ────────────────────────────────────────────────────────

export function CharacterUniverse({ credits, isLoading }: CharacterUniverseProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const cast = credits?.cast ?? [];
  const totalCast = cast.length;
  const featured = cast[0] ?? null;
  const railCast = cast.slice(1);

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }, []);

  const handleSelectActor = useCallback((actor: CastMember) => {
    navigate(`/actor/${actor.id}`, {
      state: { name: actor.name, profilePath: actor.profile_path },
    });
  }, [navigate]);

  if (!isLoading && totalCast === 0) return null;

  return (
    <section className="relative px-8 py-16">
      <div className="section-atmosphere" />

      <div className="relative z-10">
        <SectionHeader
          title="Cast"
          subtitle={`${totalCast} actor${totalCast !== 1 ? 's' : ''}`}
        />

        {isLoading ? (
          /* Skeleton */
          <div>
            <div className="w-full h-32 shimmer rounded-2xl mb-10" />
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[160px] flex-shrink-0">
                  <div className="aspect-[2/3] shimmer rounded-2xl" />
                  <div className="h-4 w-3/4 shimmer rounded mt-3" />
                  <div className="h-3 w-1/2 shimmer rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Featured actor */}
            {featured && (
              <FeaturedActor
                actor={featured}
                onClick={() => handleSelectActor(featured)}
              />
            )}

            {/* Horizontal rail */}
            {railCast.length > 0 && (
              <div className="relative group/rail">
                {/* Fade-right gradient */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to left, var(--color-bg-base), transparent)',
                  }}
                />

                {/* Left arrow */}
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-opacity duration-200 opacity-0 group-hover/rail:opacity-100"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  aria-label="Précédent"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Right arrow */}
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-opacity duration-200 opacity-0 group-hover/rail:opacity-100"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  aria-label="Suivant"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Scrollable rail */}
                <div
                  ref={scrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                >
                  {railCast.map((member) => (
                    <ActorCard
                      key={member.id}
                      member={member}
                      isSelected={false}
                      onClick={() => handleSelectActor(member)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </section>
  );
}
