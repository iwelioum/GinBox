/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Disney+ colour tokens ──────────────────────────────────────────────
      // Ex : bg-dp-bg · text-dp-text · border-dp-text/10 · border-dp-text/80
      colors: {
        dp: {
          bg:   '#040714',
          nav:  '#090b13',
          text: '#f9f9f9',
        },
      },

      // ── Font Avenir-Roman (Disney+ clone) ─────────────────────────────────
      fontFamily: {
        sans: ["'Avenir-Roman'", 'Inter', 'ui-sans-serif', 'sans-serif'],
      },

      height: {
        navbar: '70px',
      },

      boxShadow: {
        'card':       '0 26px 30px -10px rgba(0,0,0,0.69), 0 16px 10px -10px rgba(0,0,0,0.73)',
        'card-hover': '0 40px 58px -16px rgba(0,0,0,0.80), 0 30px 22px -10px rgba(0,0,0,0.72)',
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
      },
      animation: {
        'hero-progress': 'hero-progress 5s linear forwards',
        'fade-up':       'fade-up 0.4s ease-out forwards',
        'hovercard-in':  'hovercard-in 0.18s ease-out forwards',
      },
    },
  },
  plugins: [],
}
