import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useProfileStore } from '@/shared/stores/profileStore';
import { useNavbarScroll } from '@/shared/hooks/useNavbarScroll'; // Import du nouveau hook

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

const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const { opacity } = useNavbarScroll();
  const navProgress = Math.min(Math.max(opacity, 0), 1);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

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
        border: `1px solid rgba(0, 229, 255, ${navProgress * 0.12})`,
        boxShadow: `0 10px 30px rgba(0,0,0,${navProgress * 0.5})`,
      }}
    >
      <NavLink to="/" style={{ textDecoration: 'none', flexShrink: 0, marginRight: '2rem' }}>
        <AppLogo />
      </NavLink>

      <nav className="hidden md:flex items-center gap-8 h-full">
        {[
          { to: '/',            label: 'Accueil'        },
          { to: '/films',       label: 'Films'          },
          { to: '/series',      label: 'Séries'         },
          { to: '/collections', label: 'Sagas & Univers' },
          { to: '/lists',       label: 'Ma Liste'       },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              color: isActive ? 'var(--primary-red)' : 'var(--text-main)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              transition: 'color 0.2s ease',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4 ml-auto">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center rounded-full px-4 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
          style={{
            background: `rgba(22,19,43,${navProgress * 0.1})`,
            borderColor: `rgba(0,229,255,${navProgress * 0.15})`,
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all duration-300"
            style={{ color: 'var(--text-sand)' }}
          />
          <button type="submit" className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer p-0">
            <Search size={16} />
          </button>
        </form>

        {activeProfile && (
          <button
            onClick={() => navigate('/')}
            className="p-0 border-none bg-transparent cursor-pointer rounded-full overflow-hidden hover:scale-105 transition-transform"
            style={{ border: `2px solid rgba(229, 146, 104, ${navProgress})` }}
          >
            <img
              src={activeProfile.avatarUrl || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${activeProfile.name}`}
              alt="Avatar"
              className="w-8 h-8 object-cover"
            />
          </button>
        )}
      </div>
    </header>
  );
};

export { Navbar };
