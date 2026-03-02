import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useProfileStore } from '@/shared/stores/profileStore';
import { useNavbarScroll } from '@/shared/hooks/useNavbarScroll';

const AppLogo = () => (
  <img
    src="/Sokoul_Logo.svg"
    alt="Sokoul"
    style={{
      height: '28px',
      width: 'auto',
      display: 'block',
      filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
    }}
  />
);

/* ── SVG icons matching template style ── */
const IconHome = () => (
  <svg viewBox="0 0 88.7 80.9" width="16" height="16" fill="currentColor">
    <path d="M75.7,44.3v36.5H54.8V62.6H33.9v18.3H13V44.3H0L44.3,0l44.3,44.3H75.7z" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 23.9 23.4" width="16" height="16" fill="currentColor">
    <path d="M15.9,18.3c-3.9,2.8-9.4,2.4-12.9-1.1C-1,13.3-1,6.9,3,3C6.9-1,13.3-1,17.2,3c3.3,3.3,3.8,8.4,1.5,12.3l4.6,4.6c0.8,0.8,0.8,2,0,2.8l-0.2,0.2c-0.8,0.8-2,0.8-2.8,0L15.9,18.3z M10.1,17c3.8,0,6.9-3.1,6.9-6.9s-3.1-6.9-6.9-6.9c-3.8,0-6.9,3.1-6.9,6.9C3.2,13.9,6.3,17,10.1,17z" />
  </svg>
);
const IconMyList = () => (
  <svg viewBox="0 0 25.5 25.5" width="16" height="16" fill="currentColor">
    <path d="M22.6,9.8h-6.9v-7c0-1.6-1.3-2.9-2.9-2.9c-1.6,0-2.9,1.3-2.9,2.9v7h-7C1.3,9.8,0,11.1,0,12.8c0,1.6,1.3,2.9,2.9,2.9h7v6.9c0,1.6,1.3,2.9,2.9,2.9c1.6,0,2.9-1.3,2.9-2.9v-6.9h6.9c1.6,0,2.9-1.3,2.9-2.9S24.2,9.8,22.6,9.8z" />
  </svg>
);
const IconCollections = () => (
  <svg viewBox="0 0 23.2 23.2" width="16" height="16" fill="currentColor">
    <path d="M11.6,19.3l-7.2,4l1.4-8.4L0,8.9l8-1.2L11.6,0l3.6,7.7l8,1.2l-5.8,6l1.4,8.4L11.6,19.3z" />
  </svg>
);
const IconFilms = () => (
  <svg viewBox="0 0 30 22.5" width="16" height="16" fill="currentColor">
    <path d="M19.5,13.3c1.2-1.1,1.2-3,0-4.2c-1.1-1.2-3-1.2-4.2,0c-1.1,1.2-1.1,3.1,0,4.2C16.5,14.5,18.3,14.5,19.5,13.3 M7.2,13.3c1.2-1.1,1.2-3,0-4.2s-3-1.2-4.2,0c-1.1,1.2-1.1,3.1,0,4.2C4.2,14.5,6,14.5,7.2,13.3 M13.4,3c-1.1-1.2-3-1.2-4.2-0.1S8,6,9.1,7.2c0,0,0,0,0.1,0.1c1.2,1.1,3.1,1.1,4.2,0C14.5,6,14.5,4.2,13.4,3 M13.4,15.3c-1.1-1.2-3-1.2-4.2-0.1s-1.2,3-0.1,4.2c0,0,0,0,0.1,0.1c1.2,1.1,3.1,1.1,4.2,0C14.5,18.3,14.5,16.4,13.4,15.3 M11.8,10.6c-0.3-0.3-0.9-0.3-1.2,0c-0.3,0.3-0.3,0.9,0,1.2c0.3,0.3,0.9,0.3,1.2,0C12.2,11.5,12.2,11,11.8,10.6 M29.9,10c-3.3,6.9-8.2,9.9-11.6,11.2c-2.6,1-4.8,1.2-5.9,1.2c-0.3,0-0.7,0.1-1.1,0.1C5,22.5,0,17.5,0,11.2S5,0,11.2,0c6.2,0,11.2,5,11.2,11.2c0,2.6-0.9,5.1-2.5,7.1c2.8-1.6,5.8-4.4,8.1-9.1c0.3-0.5,0.8-0.6,1.3-0.4C29.9,9,30.1,9.5,29.9,10" />
  </svg>
);
const IconSeries = () => (
  <svg viewBox="0 0 23.2 24" width="16" height="16" fill="currentColor">
    <path d="M12.5,6h6.7c2.2,0,4,1.8,4,4v10c0,2.2-1.8,4-4,4H4c-2.2,0-4-1.8-4-4V10c0-2.2,1.8-4,4-4h6.2l-4-4c-0.5-0.5-0.5-1.2,0-1.6c0.5-0.5,1.2-0.5,1.6,0l3.5,3.5l3.5-3.5c0.5-0.5,1.2-0.5,1.6,0s0.5,1.2,0,1.6L12.5,6z M18.9,13.7c0.9,0,1.7-0.8,1.7-1.7s-0.8-1.7-1.7-1.7S17.2,11,17.2,12S17.9,13.7,18.9,13.7z M18.9,19.7c0.9,0,1.7-0.7,1.8-1.7c0-0.9-0.7-1.7-1.7-1.8c-0.9,0-1.7,0.8-1.7,1.8C17.2,18.9,18,19.7,18.9,19.7z" />
  </svg>
);

const NAV_ITEMS: { to: string; label: string; icon: React.FC }[] = [
  { to: '/',            label: 'Home',        icon: IconHome },
  { to: '/search',      label: 'Search',      icon: IconSearch },
  { to: '/films',       label: 'Films',       icon: IconFilms },
  { to: '/series',      label: 'Series',      icon: IconSeries },
  { to: '/collections', label: 'Collections', icon: IconCollections },
  { to: '/lists',       label: 'My List',     icon: IconMyList },
];

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const { opacity } = useNavbarScroll();
  const navProgress = Math.min(Math.max(opacity, 0), 1);

  return (
    <header
      className="fixed flex items-center justify-between transition-all duration-300"
      style={{
        top: `calc(var(--titlebar-height) + ${10 + navProgress * 8}px)`,
        left: '50%',
        transform: `translateX(-50%) translateY(${navProgress * 6}px) scale(${1 - navProgress * 0.025})`,
        width: `${92 - navProgress * 4}%`,
        maxWidth: `${1260 - navProgress * 80}px`,
        height: `${68 - navProgress * 6}px`,
        padding: `0 ${28 - navProgress * 6}px`,
        borderRadius: `${36 - navProgress * 6}px`,
        zIndex: 40,
        background: `rgba(10, 11, 22, ${navProgress * 0.8})`,
        backdropFilter: `blur(${Math.round(navProgress * 20)}px)`,
        WebkitBackdropFilter: `blur(${Math.round(navProgress * 20)}px)`,
        border: `1px solid rgba(255, 255, 255, ${navProgress * 0.08})`,
        boxShadow: `0 10px 30px rgba(0,0,0,${navProgress * 0.5}), 0 0 60px rgba(108,92,231,${navProgress * 0.08})`,
      }}
    >
      <NavLink to="/" style={{ textDecoration: 'none', flexShrink: 0, marginRight: '2rem' }}>
        <AppLogo />
      </NavLink>

      <nav className="hidden md:flex items-center gap-1 h-full">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="group"
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(108, 92, 231, 0.15)' : 'transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.6, transition: 'opacity 0.2s' }}>
                  <Icon />
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isActive ? '60%' : '0%',
                    height: 2,
                    borderRadius: 1,
                    background: 'var(--primary-violet)',
                    transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4 ml-auto">
        {activeProfile && (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-0 border-none bg-transparent cursor-pointer hover:scale-105 transition-transform"
          >
            <img
              src={activeProfile.avatarUrl || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${activeProfile.name}`}
              alt="Avatar"
              className="w-8 h-8 object-cover rounded-full"
              style={{ border: `2px solid rgba(108, 92, 231, ${0.3 + navProgress * 0.7})` }}
            />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {activeProfile.name}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

export { Navbar };
