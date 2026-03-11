// components/detail/CastSection.tsx — Netflix 2025 × Infuse × Apple TV cast section
// Circular photos with hover effects and premium styling

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
    <div
      className="flex-shrink-0 flex flex-col items-center gap-3 w-16 group cursor-pointer"
      onClick={() =>
        navigate(`/actor/${person.id}`, {
          state: { name: person.name, profilePath: photoUrl },
        })
      }
    >
      {/* Circular photo */}
      <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--color-border)] 
                      transition-all duration-300 group-hover:ring-[var(--color-accent)]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0
                       transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-bg-elevated)] flex items-center justify-center
                          text-[var(--color-text-muted)]">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center space-y-1">
        <span className="text-xs text-[var(--color-text-secondary)] font-medium leading-tight
                         block w-full truncate">
          {person.name}
        </span>
        {person.character && (
          <span className="text-xs text-[var(--color-text-muted)] leading-tight
                           block w-full truncate">
            {person.character}
          </span>
        )}
      </div>
    </div>
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
    <section className="space-y-6">
      <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
        {t('detail.mainCast')}
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[var(--color-border)]">
        {cast.slice(0, 12).map(person => (
          <CastCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
};
