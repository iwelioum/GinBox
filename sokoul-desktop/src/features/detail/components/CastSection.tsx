// components/detail/CastSection.tsx — Premium cast with rectangular portraits
// 3:4 aspect photos, director spotlight, Framer Motion stagger entrance

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CastMember, Credits } from '../../../shared/types/index';
import type { GenreTheme } from '../../../shared/utils/genreTheme';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const CastCard: React.FC<{ person: CastMember }> = ({ person }) => {
  const navigate = useNavigate();
  const photoUrl = person.profile_path || null;

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      aria-label={`${person.name}${person.character ? ` — ${person.character}` : ''}`}
      className="flex-shrink-0 flex flex-col items-center gap-2.5 w-[88px] group cursor-pointer
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]
                 rounded-xl"
      onClick={() =>
        navigate(`/actor/${person.id}`, {
          state: { name: person.name, profilePath: photoUrl },
        })
      }
    >
      {/* Photo — 3:4 rectangular portrait */}
      <div className="w-[80px] h-[106px] rounded-xl overflow-hidden
                      ring-1 ring-[var(--color-border)] transition-all duration-300
                      group-hover:ring-[var(--color-accent)]
                      group-hover:shadow-[0_4px_20px_var(--color-accent-shadow,rgba(108,99,255,0.2))]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover object-top
                       grayscale-[30%] group-hover:grayscale-0
                       transition-[filter,transform] duration-500 ease-out
                       group-hover:scale-105"
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
    </motion.button>
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

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.04 }}
        className="flex gap-4 overflow-x-auto pb-4
                   scrollbar-thin scrollbar-thumb-[var(--color-white-8)] scrollbar-track-transparent"
      >
        {cast.slice(0, 15).map(person => (
          <CastCard key={person.id} person={person} />
        ))}
      </motion.div>
    </section>
  );
};
