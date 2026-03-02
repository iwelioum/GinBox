// BrandRow.tsx — Ligne des plateformes de streaming
// RÈGLES : 6 blocs 16/9, border rgba(202,202,202,0.26), hover scale+masque,
//          positionné IMMÉDIATEMENT après le Hero, AVANT les carousels.

import * as React from 'react';
import { useNavigate } from 'react-router-dom';

interface Platform {
  id: number;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  fontWeight: number;
  fontSize: string;
  letterSpacing: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 8,
    name: 'Netflix',
    shortName: 'N',
    color: '#e50914',
    textColor: '#fff',
    fontWeight: 900,
    fontSize: '42px',
    letterSpacing: '-1px',
  },
  {
    id: 337,
    name: 'Disney+',
    shortName: 'Disney+',
    color: '#113ccf',
    textColor: '#fff',
    fontWeight: 800,
    fontSize: '18px',
    letterSpacing: '1px',
  },
  {
    id: 384,
    name: 'Max',
    shortName: 'max',
    color: '#002be7',
    textColor: '#fff',
    fontWeight: 900,
    fontSize: '28px',
    letterSpacing: '-1px',
  },
  {
    id: 283,
    name: 'Crunchyroll',
    shortName: 'CR',
    color: '#f47521',
    textColor: '#fff',
    fontWeight: 900,
    fontSize: '22px',
    letterSpacing: '0',
  },
  {
    id: 531,
    name: 'Paramount+',
    shortName: 'P+',
    color: '#0064ff',
    textColor: '#fff',
    fontWeight: 900,
    fontSize: '26px',
    letterSpacing: '-1px',
  },
  {
    id: 350,
    name: 'Apple TV+',
    shortName: '⎇ TV+',
    color: '#000000',
    textColor: '#fff',
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '0.5px',
  },
];

const BrandBlock: React.FC<{ platform: Platform; onClick: () => void }> = ({ platform, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 'calc((100% - 5 * 12px) / 6)',
        aspectRatio: '16 / 9',
        maxHeight: '120px',
        position: 'relative',
        overflow: 'hidden',
        border: '4px solid rgba(202, 202, 202, 0.26)',
        borderRadius: '10px',
        cursor: 'pointer',
        background: `linear-gradient(135deg, #3a3c4a 0%, #242632 100%)`,
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        borderColor: hovered ? 'rgba(249,249,249,0.55)' : 'rgba(202,202,202,0.26)',
        padding: 0,
      }}
    >
      {/* Bande couleur de la plateforme (côté gauche) */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '5px',
        background: platform.color,
        transition: 'width 0.2s ease',
        ...(hovered && { width: '100%', opacity: 0.15 }),
      }} />

      {/* Masque gradient — disparaît au hover */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, #3a3c4a, #242632)',
        opacity: hovered ? 0 : 0.5,
        transition: 'opacity 0.25s ease',
        zIndex: 1,
      }} />

      {/* Nom de la plateforme */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          color: platform.textColor,
          fontFamily: 'var(--font-main)',
          fontWeight: platform.fontWeight,
          fontSize: platform.fontSize,
          letterSpacing: platform.letterSpacing,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          userSelect: 'none',
          transition: 'opacity 0.2s ease',
        }}>
          {platform.shortName}
        </span>
      </div>
    </button>
  );
};

const BrandRow: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section style={{
      paddingLeft: 'var(--section-px)',
      paddingRight: 'var(--section-px)',
      paddingTop: '2.5rem',
      paddingBottom: '1rem',
    }}>
      <h2 style={{
        margin: '0 0 1rem 0',
        fontSize: '22px',
        fontWeight: 700,
        color: '#f9f9f9',
        fontFamily: 'var(--font-main)',
        letterSpacing: '0.3px',
      }}>
        Parcourir par plateforme
      </h2>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {PLATFORMS.map((platform) => (
          <BrandBlock
            key={platform.id}
            platform={platform}
            onClick={() => navigate(`/search?type=movie&provider=${platform.id}`)}
          />
        ))}
      </div>
    </section>
  );
};

export { BrandRow };
