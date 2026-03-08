// Navbar.tsx — Netflix 2025 × Infuse × Apple TV Premium Dark Aesthetic
// Fixed top-0, gradient background, premium glass effect on scroll
// Nav links: center-aligned, accent underline for active state
// Search expands inline, profile avatar with hover ring

import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';

// ── Main nav items (center section) ──────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',        labelKey: 'navbar.home' },
  { to: '/films',   labelKey: 'navbar.movies' },
  { to: '/series',  labelKey: 'navbar.series' },
  { to: '/lists',   labelKey: 'navbar.watchlist' },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

const Navbar: React.FC = () => {
  const { t }         = useTranslation();
  const navigate      = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const scrollY       = useScrollPosition();
  // Transparent while on the hero (65vh), opaque afterwards
  const isScrolled = scrollY > window.innerHeight * 0.65;

  return (
    // Fixed navbar with gradient background and glass effect on scroll
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 h-[var(--navbar-height)]"
      style={{ paddingTop: 'var(--titlebar-height)' }}
      animate={{
        backgroundColor: isScrolled 
          ? 'rgba(10,10,15,0.95)' 
          : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Main content container */}
      <div className="flex items-center justify-between h-[var(--navbar-height)] px-8">
        
        {/* ── Logo ── */}
        <NavLink to="/" className="flex-shrink-0">
          <img
            src="/Sokoul_Logo.svg"
            alt="Sokoul"
            className="h-8 w-auto block"
          />
        </NavLink>

        {/* ── Center nav links ── */}
        <div className="flex items-center gap-8">
          {NAV_ITEMS.map(({ to, labelKey }) => {
            const label = t(labelKey);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors duration-200 ${
                    isActive
                      ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)] pb-1'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`
                }
              >
                {label}
              </NavLink>
            );
          })}
        </div>

        {/* ── Right section: Search + Profile ── */}
        <div className="flex items-center gap-4">
          
          {/* Expandable search */}
          <div className="flex items-center">
            <button
              onClick={() => setSearchExpanded(!searchExpanded)}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
            >
              <Search size={20} />
            </button>
            <motion.div
              className="overflow-hidden"
              initial={false}
              animate={{ width: searchExpanded ? 240 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <input
                type="text"
                placeholder={t('navbar.search')}
                className="w-60 ml-2 bg-transparent border-b border-white/20 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none py-1 transition-colors duration-200"
                autoFocus={searchExpanded}
              />
            </motion.div>
          </div>

          {/* Profile avatar */}
          {activeProfile && (
            <div className="relative group">
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[var(--color-accent)] transition-all duration-200"
              >
                <img
                  src={
                    activeProfile.avatarUrl ??
                    `https://api.dicebear.com/8.x/pixel-art/svg?seed=${activeProfile.name}`
                  }
                  alt={activeProfile.name}
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Profile dropdown */}
              <div className="absolute right-0 top-full mt-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-w-[120px] py-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)] transition-colors duration-150"
                >
                  {t('navbar.profile')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export { Navbar };
