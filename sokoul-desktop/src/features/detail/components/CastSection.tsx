// components/detail/CastSection.tsx
// Photos circulaires, grayscale → couleur au hover
// ring-[var(--accent)] au hover

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CastMember, Credits } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface CastCardProps {
  person: CastMember;
}

const CastCard: React.FC<CastCardProps> = ({ person }) => {
  const navigate = useNavigate();
  const photoUrl = person.profile_path || person.profilePath || null;

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-2 w-[100px] group cursor-pointer"
      onClick={() =>
        navigate(`/actor/${person.id}`, {
          state: { name: person.name, profilePath: photoUrl },
        })
      }
    >
      {/* Photo circulaire */}
      <div
        className="w-[100px] h-[100px] rounded-full overflow-hidden
                   ring-2 ring-white/10 transition-all duration-300"
        style={{
          // ring accent au hover via JS (pas de support Tailwind pour CSS var dans ring)
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 0 0 2px var(--accent, #0072D2)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 0 0 2px rgba(255,255,255,0.1)';
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover
                       filter grayscale group-hover:grayscale-0
                       transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full bg-[#252833] flex items-center justify-center
                          text-white/30">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      <span className="text-xs text-white/70 text-center font-medium leading-tight
                       w-full truncate px-1">
        {person.name}
      </span>
      {person.character && (
        <span className="text-[10px] text-white/30 text-center leading-tight
                         w-full truncate px-1 -mt-1">
          {person.character}
        </span>
      )}
    </div>
  );
};

interface CastSectionProps {
  cast?:    CastMember[];
  credits?: Credits;
  theme?:   GenreTheme;
}

export const CastSection: React.FC<CastSectionProps> = ({ cast: castProp, credits, theme: _theme }) => {
  const cast = castProp ?? credits?.cast ?? [];
  if (!cast || cast.length === 0) return null;

  return (
    <section className="mb-[40px]">
      <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">
        Casting principal
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {cast.slice(0, 12).map(person => (
          <CastCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
};
