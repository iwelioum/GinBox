/** Predefined glassmorphism style sets ensuring visual consistency; each variant is tuned for a specific UI context (navbar, modals, genre-themed cards). */
export const GLASS_VARIANTS = {
  'frosted': {
    background:     'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    border:         '1px solid rgba(255,255,255,0.08)',
    boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
  },
  'neon-edge': {
    background:     'rgba(0,20,40,0.6)',
    backdropFilter: 'blur(16px)',
    border:         '1px solid var(--accent)',
    boxShadow:      '0 0 20px rgba(var(--accent-rgb),0.2), inset 0 0 20px rgba(var(--accent-rgb),0.03)',
  },
  'warm-glow': {
    background:     'rgba(30,15,5,0.5)',
    backdropFilter: 'blur(24px)',
    border:         '1px solid rgba(var(--accent-rgb),0.2)',
    boxShadow:      '0 8px 32px rgba(var(--accent-rgb),0.1)',
  },
  'clean': {
    background:     'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    border:         '1px solid rgba(255,255,255,0.12)',
    boxShadow:      '0 4px 16px rgba(0,0,0,0.3)',
  },
} as const;

/** Union of available glass style keys, used to type-safely select a variant without risking invalid lookups. */
export type GlassVariant = keyof typeof GLASS_VARIANTS;
