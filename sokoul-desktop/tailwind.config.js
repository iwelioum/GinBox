/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Premium Netflix 2025 × Infuse × Apple TV Design Tokens ──
      colors: {
        'bg-base':     'var(--color-bg-base)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-overlay':  'var(--color-bg-overlay)',
        'border':      'var(--color-border)',
        'text-primary':'var(--color-text-primary)',
        'text-secondary':'var(--color-text-secondary)',
        'text-muted':  'var(--color-text-muted)',
        'accent':      'var(--color-accent)',
        'accent-hover':'var(--color-accent-hover)',
        'danger':      'var(--color-danger)',
        'success':     'var(--color-success)',
        // Keep dp aliases for backwards compat
        dp: { 
          bg: 'var(--color-bg-base)', 
          nav: 'var(--color-bg-elevated)', 
          text: 'var(--color-text-primary)' 
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      height: {
        navbar: '64px',
      },

      spacing: {
        'xs': '4px', 
        'sm': '8px', 
        'md': '16px', 
        'lg': '24px', 
        'xl': '40px', 
        '2xl': '64px',
      },

      borderRadius: {
        'card': '8px', 
        'pill': '9999px', 
        'modal': '16px', 
        'button': '8px',
      },

      boxShadow: {
        'card': '0 8px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 24px 60px rgba(0,0,0,0.6)',
        'overlay': '0 24px 60px rgba(0,0,0,0.6)',
      },

      letterSpacing: {
        nav: '1.42px',
      },

      keyframes: {
        'hero-progress': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'hovercard-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'hero-progress': 'hero-progress 5s linear forwards',
        'fade-up':       'fade-up 0.4s ease-out forwards',
        'hovercard-in':  'hovercard-in 0.18s ease-out forwards',
        'page-enter':    'page-enter 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
}
