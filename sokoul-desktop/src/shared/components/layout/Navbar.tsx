// Navbar.tsx — Disney+ Header style
// Fixed top-0 · covers TitleBar (32px) + NavBar (70px) · z-40
// Transparent over the hero, glassmorphism (blur 20px) after scroll
// Nav links: underline scaleX(0→1) via before: pseudo, cubic-bezier Disney+
// Right-side avatar with Profile dropdown on hover

import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@/stores/profileStore';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';

// -- Nav items ----------------------------------------------------------------

const NAV_ITEMS = [
  { to: '/',            labelKey: 'navbar.home',        icon: '/images/home-icon.svg'      },
  { to: '/search',      labelKey: 'navbar.search',      icon: '/images/search-icon.svg'    },
  { to: '/lists',       labelKey: 'navbar.watchlist',   icon: '/images/watchlist-icon.svg' },
  { to: '/films',       labelKey: 'navbar.movies',      icon: '/images/movie-icon.svg'     },
  { to: '/series',      labelKey: 'navbar.series',      icon: '/images/series-icon.svg'    },
  { to: '/collections', labelKey: 'navbar.collections', icon: '/images/original-icon.svg'  },
] as const;

// -- Component ----------------------------------------------------------------

const Navbar: React.FC = () => {
  const { t }         = useTranslation();
  const navigate      = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const scrollY       = useScrollPosition();
  const isTransparent = scrollY < window.innerHeight * 0.65;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 pt-[var(--titlebar-height)] tracking-[16px]"
      animate={{
        backgroundColor: isTransparent ? 'rgba(0,0,0,0)' : 'rgba(9,11,19,0.85)',
        backdropFilter:  isTransparent ? 'blur(0px)'      : 'blur(20px)',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex items-center justify-between h-[var(--navbar-height)] px-9">
        {/* -- Logo -- */}
        <NavLink to="/" className="flex-shrink-0 tracking-normal">
          <img
            src="/Sokoul_Logo.svg"
            alt="Sokoul"
            className="w-20 h-auto block"
          />
        </NavLink>

        {/* -- NavMenu -- */}
        <div className="flex items-center flex-row flex-nowrap h-full ml-[25px] mr-auto">
          {NAV_ITEMS.map(({ to, labelKey, icon }) => {
            const label = t(labelKey);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className="group/link flex items-center px-3 no-underline"
              >
                <img
                  src={icon}
                  alt={label}
                  className="h-5 w-5 min-w-[20px]"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />

                <span
                  className={[
                    'relative ml-1.5',
                    'before:content-[""]',
                    'before:absolute before:bottom-[-6px] before:left-0 before:right-0',
                    'before:h-[2px] before:rounded-b-[4px] before:bg-dp-text',
                    'before:scale-x-0 before:origin-left before:opacity-0',
                    'before:transition-all before:duration-[250ms]',
                    'before:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]',
                    'group-hover/link:before:scale-x-100 group-hover/link:before:opacity-100',
                    'text-[var(--color-text-primary)] text-[13px] tracking-[1.42px]',
                    'leading-[1.08] py-0.5 whitespace-nowrap',
                  ].join(' ')}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* -- Avatar + dropdown -- */}
        {activeProfile !== null && activeProfile !== undefined && (
          <div className="relative flex items-center justify-center cursor-pointer group/avatar
                          h-12 w-12">
            <img
              src={
                activeProfile.avatarUrl ??
                `https://api.dicebear.com/8.x/pixel-art/svg?seed=${activeProfile.name}`
              }
              alt={activeProfile.name}
              className="w-full h-full object-cover rounded-full border-2 border-white/30"
            />

            {/* Dropdown — visible on hover */}
            <div
              className="absolute right-0 top-12 opacity-0 group-hover/avatar:opacity-100
                         pointer-events-none group-hover/avatar:pointer-events-auto
                         bg-[rgb(19,19,19)] border border-[rgba(151,151,151,0.34)]
                         rounded-[var(--radius-card)] shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                         py-1.5 text-sm tracking-normal min-w-[160px]
                         transition-opacity duration-[var(--transition-base)] whitespace-nowrap"
            >
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-left bg-transparent border-none cursor-pointer text-dp-text
                           hover:bg-white/10 text-[13px] tracking-[0.5px] px-4 py-2 block
                           transition-colors duration-[var(--transition-fast)]"
              >
                {t('navbar.profile')}
              </button>

              <div className="h-px bg-[rgba(151,151,151,0.2)] my-1" />

              <button
                onClick={() => navigate('/settings')}
                className="w-full text-left bg-transparent border-none cursor-pointer text-dp-text
                           hover:bg-white/10 text-[13px] tracking-[0.5px] px-4 py-2 block
                           transition-colors duration-[var(--transition-fast)]"
              >
                {t('common.settings')}
              </button>

              <div className="h-px bg-[rgba(151,151,151,0.2)] my-1" />

              <button
                onClick={() => navigate('/profile-select')}
                className="w-full text-left bg-transparent border-none cursor-pointer text-dp-text
                           hover:bg-white/10 text-[13px] tracking-[0.5px] px-4 py-2 block
                           transition-colors duration-[var(--transition-fast)]"
              >
                {t('navbar.switchProfile')}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export { Navbar };
