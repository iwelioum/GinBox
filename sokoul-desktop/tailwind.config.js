/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          card: 'var(--color-bg-card)',
          glass: 'var(--color-bg-glass)',
          overlay: 'var(--color-bg-overlay)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          glow: 'var(--color-accent-glow)',
        },
        brand: {
          disney: 'var(--color-brand-disney)',
          pixar: 'var(--color-brand-pixar)',
          marvel: 'var(--color-brand-marvel)',
          starwars: 'var(--color-brand-starwars)',
          natgeo: 'var(--color-brand-natgeo)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        }
      },
      boxShadow: {
        'card':       '0 10px 14px 3px #0000005c',  /* html.md exact */
        'card-hover': 'var(--shadow-card-hover)',
        'button':     'var(--shadow-button)',
      },
      letterSpacing: {
        'nav': '1.42px',   /* .nav-link html.md */
      },
      transitionDuration: {
        card: '300ms',
      },
      width: {
        'card-landscape': 'var(--card-landscape-w)',
        'card-poster': 'var(--card-poster-w)',
      },
      height: {
        'card-landscape': 'var(--card-landscape-h)',
        'card-poster': 'var(--card-poster-h)',
        'navbar': 'var(--navbar-height)',
        'hero': 'var(--hero-height)',
      },
      padding: {
        'section': 'var(--section-px)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
        button: 'var(--radius-button)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        sans: 'var(--font-main)',
      },
      transitionTimingFunction: {
        'card': 'var(--transition-card)',
      },
      transitionDuration: {
        DEFAULT: '150ms', // from --transition-fast
        card: 'var(--transition-card)',
        hero: 'var(--transition-hero)',
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-navbar': 'var(--gradient-navbar)',
        'gradient-card-hover': 'var(--gradient-card-hover)',
      },
      keyframes: {
        'hovercard-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)'      },
        },
        'kenburns': {
          '0%':   { transform: 'scale(1) translate(0, 0)' },
          '25%':  { transform: 'scale(1.08) translate(-1%, -1%)' },
          '50%':  { transform: 'scale(1.08) translate(1%, -1%)' },
          '75%':  { transform: 'scale(1.05) translate(-0.5%, 0.5%)' },
          '100%': { transform: 'scale(1) translate(0, 0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        'count-bar': {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'hero-progress': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'hovercard-in': 'hovercard-in 0.18s ease-out forwards',
        'kenburns':     'kenburns 20s ease-in-out infinite',
        'fade-up':      'fade-up 0.4s ease-out forwards',
        'count-bar':    'count-bar 0.8s ease-out forwards',
        'hero-progress':'hero-progress 8s linear forwards',
      },
    },
  },
  plugins: [],
}
