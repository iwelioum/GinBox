// Navbar.tsx — Disney+ Header style
// Fixed top-0 · covers TitleBar (32px) + NavBar (70px) · z-40
// Transparent over the hero, glassmorphism (blur 20px) after scroll
// Nav links: underline scaleX(0→1) via before: pseudo, cubic-bezier Disney+
// Right-side avatar with Profile dropdown on hover

import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProfileStore } from '@/stores/profileStore';
import { useScrollPosition } from '@/shared/hooks/useScrollPosition';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',            label: 'HOME',        icon: '/images/home-icon.svg'      },
  { to: '/search',      label: 'SEARCH',      icon: '/images/search-icon.svg'    },
  { to: '/lists',       label: 'WATCHLIST',   icon: '/images/watchlist-icon.svg' },
  { to: '/films',       label: 'MOVIES',      icon: '/images/movie-icon.svg'     },
  { to: '/series',      label: 'SERIES',      icon: '/images/series-icon.svg'    },
  { to: '/collections', label: 'COLLECTIONS', icon: '/images/original-icon.svg'  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

const Navbar: React.FC = () => {
  const navigate      = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const scrollY       = useScrollPosition();
  // Transparent while on the hero (65vh), opaque afterwards
  const isTransparent = scrollY < window.innerHeight * 0.65;

  return (
    // fixed top-0: covers the TitleBar (32px) for zero visible gap
    // paddingTop pushes nav content away from the Electron drag area
    // glassmorphism: rgba(9,11,19,0.85) + blur(20px) after the hero
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        paddingTop:    'var(--titlebar-height)',
        letterSpacing: '16px',
      }}
      animate={{
        backgroundColor: isTransparent ? 'rgba(0,0,0,0)' : 'rgba(9,11,19,0.85)',
        backdropFilter:  isTransparent ? 'blur(0px)'      : 'blur(20px)',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Content bar — navbar height, horizontal padding */}
      <div
        className="flex items-center justify-between"
        style={{ height: 'var(--navbar-height)', padding: '0 36px' }}
      >
      {/* ── Logo ── */}
      <NavLink
        to="/"
        className="flex-shrink-0"
        style={{ letterSpacing: 0 }}
      >
        <img
          src="/Sokoul_Logo.svg"
          alt="Sokoul"
          style={{ width: 80, height: 'auto', display: 'block' }}
        />
      </NavLink>

      {/* ── NavMenu ── */}
      <div
        className="flex items-center flex-row flex-nowrap h-full"
        style={{ marginLeft: 25, marginRight: 'auto' }}
      >
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="group/link flex items-center"
            style={{ padding: '0 12px', textDecoration: 'none' }}
          >
            {/* SVG Icon */}
            <img
              src={icon}
              alt={label}
              style={{ height: 20, minWidth: 20, width: 20 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />

            {/* Label + underline animation (Disney+ ::before scaleX trick) */}
            <span
              className={[
                'relative ml-1.5',
                // Pseudo-element underline: scaleX(0) → scaleX(1) on hover
                'before:content-[""]',
                'before:absolute before:bottom-[-6px] before:left-0 before:right-0',
                'before:h-[2px] before:rounded-b-[4px] before:bg-dp-text',
                'before:scale-x-0 before:origin-left before:opacity-0',
                'before:transition-all before:duration-[250ms]',
                'before:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)]',
                'group-hover/link:before:scale-x-100 group-hover/link:before:opacity-100',
              ].join(' ')}
              style={{
                color:         '#f9f9f9',
                fontSize:      13,
                letterSpacing: '1.42px',
                lineHeight:    1.08,
                padding:       '2px 0',
                whiteSpace:    'nowrap',
              }}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </div>

      {/* ── Avatar + dropdown ── */}
      {activeProfile !== null && activeProfile !== undefined && (
        <div className="relative flex items-center justify-center cursor-pointer group/avatar"
          style={{ height: 48, width: 48 }}
        >
          <img
            src={
              activeProfile.avatarUrl ??
              `https://api.dicebear.com/8.x/pixel-art/svg?seed=${activeProfile.name}`
            }
            alt={activeProfile.name}
            className="w-full h-full object-cover rounded-full"
            style={{ border: '2px solid rgba(249,249,249,0.3)' }}
          />

          {/* Dropdown "Sign out" — visible on hover */}
          <div
            className="absolute right-0 top-12 opacity-0 group-hover/avatar:opacity-100"
            style={{
              background:   'rgb(19,19,19)',
              border:       '1px solid rgba(151,151,151,0.34)',
              borderRadius: 4,
              boxShadow:    'rgba(0,0,0,0.5) 0 0 18px 0',
              padding:      10,
              fontSize:     14,
              letterSpacing: 3,
              width:        100,
              transition:   'opacity 1s ease',
              whiteSpace:   'nowrap',
            }}
          >
            <button
              onClick={() => navigate('/profile')}
              className="w-full text-left text-dp-text bg-transparent border-none cursor-pointer"
              style={{ fontSize: 13, letterSpacing: 2, padding: '4px 0' }}
            >
              Profile
            </button>
          </div>
        </div>
      )}
      </div>
    </motion.nav>
  );
};

export { Navbar };
