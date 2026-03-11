// components/detail/CastSection.tsx — Premium cast carousel
// Larger photos, scale + shadow on hover, smooth grayscale transition

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CastMember, Credits } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

interface CastCardProps {
  person: CastMember;
}

const CastCard: React.FC<CastCardProps> = ({ person }) => {
  const navigate = useNavigate();
  const photoUrl = person.profile_path || null;

  return (
    <button
      type="button"
      className="flex-shrink-0 flex flex-col items-center gap-3 w-20 group cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-xl
                 transition-transform duration-300 hover:scale-105"
      onClick={() =>
        navigate(`/actor/${person.id}`, {
          state: { name: person.name, profilePath: photoUrl },
        })
      }
    >
      {/* Photo — 72px with ring glow on hover */}
      <div className="w-[72px] h-[72px] rounded-full overflow-hidden
                      ring-2 ring-[var(--color-border)] transition-all duration-300
                      group-hover:ring-[var(--color-accent)]
                      group-hover:shadow-[0_0_20px_rgba(108,99,255,0.25)]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover
                       grayscale group-hover:grayscale-0
                       transition-[filter] duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center
                          text-[var(--color-text-muted)]">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name + character */}
      <div className="text-center space-y-0.5 w-full">
        <span className="text-sm text-[var(--color-text-secondary)] font-medium leading-tight
                         block truncate group-hover:text-[var(--color-text-primary)]
                         transition-colors duration-200">
          {person.name}
        </span>
        {person.character && (
          <span className="text-xs text-[var(--color-text-muted)] leading-tight block truncate">
            {person.character}
          </span>
        )}
      </div>
    </button>
  );
};

interface CastSectionProps {
  cast?:    CastMember[];
  credits?: Credits;
  theme?:   GenreTheme;
}

export const CastSection: React.FC<CastSectionProps> = ({ cast: castProp, credits, theme: _theme }) => {
  const { t } = useTranslation();
  const cast = castProp ?? credits?.cast ?? [];

  if (!cast || cast.length === 0) return null;

  return (
    <section className="space-y-5">
      <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
        {t('detail.mainCast')}
      </h2>

      <div className="flex gap-5 overflow-x-auto pb-4
                      scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {cast.slice(0, 15).map(person => (
          <CastCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
};
