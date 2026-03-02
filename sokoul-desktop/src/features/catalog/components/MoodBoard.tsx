// components/home/MoodBoard.tsx — Tâche 4.2
// 9 ambiances cliquables → filtre genre + teinte fond

import * as React from 'react';
import {
  ShieldAlert,
  Smile,
  Zap,
  Heart,
  Rocket,
  Droplets,
  Compass,
  Brain,
  House,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface Mood {
  key:      string;
  label:    string;
  genreIds: string[];  // TMDB genre IDs (strings)
  bg:       string;    // couleur hex pour glow + fond actif
}

export const MOODS: Mood[] = [
  { key: 'frissons',     label: 'Frissons',     genreIds: ['27', '53'],        bg: '#7f1d1d' },
  { key: 'bonne-humeur', label: 'Bonne humeur', genreIds: ['35', '10751'],      bg: '#78350f' },
  { key: 'intense',      label: 'Intense',      genreIds: ['28', '80'],         bg: '#1e1b4b' },
  { key: 'romance',      label: 'Romance',      genreIds: ['10749', '18'],      bg: '#831843' },
  { key: 'epique',       label: 'Épique',       genreIds: ['12', '14'],         bg: '#14532d' },
  { key: 'emouvant',     label: 'Émouvant',     genreIds: ['18', '36'],         bg: '#1e3a5f' },
  { key: 'voyager',      label: 'Voyager',      genreIds: ['99', '36'],         bg: '#064e3b' },
  { key: 'reflechir',    label: 'Réfléchir',    genreIds: ['878', '9648'],      bg: '#312e81' },
  { key: 'famille',      label: 'Famille',      genreIds: ['16', '10751'],      bg: '#7c3aed' },
];

const MOOD_ICONS: Record<string, LucideIcon> = {
  frissons: ShieldAlert,
  'bonne-humeur': Smile,
  intense: Zap,
  romance: Heart,
  epique: Rocket,
  emouvant: Droplets,
  voyager: Compass,
  reflechir: Brain,
  famille: House,
};

interface MoodBoardProps {
  activeMood:   string | null;
  onMoodChange: (key: string | null, genreIds: string[]) => void;
}

export const MoodBoard: React.FC<MoodBoardProps> = ({ activeMood, onMoodChange }) => {
  return (
    <section
      style={{
        padding:      '0 var(--section-px)',
        marginBottom: '32px',
      }}
    >
      <h2
        className="text-[13px] font-semibold uppercase tracking-[0.14em] mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        Ce soir, j'ai envie de...
      </h2>

      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {MOODS.map(mood => {
          const isActive = activeMood === mood.key;
          const MoodIcon = MOOD_ICONS[mood.key] ?? Sparkles;

          return (
            <button
              key={mood.key}
              type="button"
              onClick={() =>
                onMoodChange(
                  isActive ? null : mood.key,
                  isActive ? [] : mood.genreIds,
                )
              }
              className="flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5
                         rounded-full text-[13px] font-semibold
                         transition-all duration-300 cursor-pointer
                         border whitespace-nowrap"
              style={{
                background:  isActive
                  ? `linear-gradient(135deg, ${mood.bg}dd, ${mood.bg}88)`
                  : 'var(--glass-surface)',
                border:      isActive ? `1px solid ${mood.bg}` : 'var(--glass-border)',
                color:       isActive ? '#fff' : 'var(--text-sand)',
                transform:   isActive ? 'scale(1.06)' : 'scale(1)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                boxShadow:   isActive
                  ? `0 0 22px ${mood.bg}55, inset 0 1px 0 rgba(255,255,255,0.15)`
                  : '0 6px 20px rgba(0,0,0,0.22)',
              }}
            >
              <MoodIcon size={16} strokeWidth={2.2} />
              {mood.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
