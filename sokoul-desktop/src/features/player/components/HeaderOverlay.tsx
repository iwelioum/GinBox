// HeaderOverlay.tsx — Bandeau superieur du lecteur
// Rendu dans PlayerPage (fenetre principale), pas l'overlay

import { ArrowLeft, Subtitles, Settings } from 'lucide-react';

export interface HeaderOverlayProps {
  title:         string;
  year?:         string;
  rating?:       string;
  onBack:        () => void;
  onSubtitles?:  () => void;
  onSettings?:   () => void;
}

export function HeaderOverlay({
  title,
  year,
  rating,
  onBack,
  onSubtitles,
  onSettings,
}: HeaderOverlayProps) {
  return (
    <div
      style={{
        position:       'absolute',
        top:            0,
        left:           0,
        width:          '100%',
        height:         'var(--player-header-h, 60px)',
        background:     'var(--player-overlay-top, linear-gradient(to bottom, rgba(0,0,0,0.85), transparent))',
        display:        'flex',
        alignItems:     'center',
        padding:        '0 var(--player-pad-h, 16px)',
        gap:            'var(--player-gap, 12px)',
        boxSizing:      'border-box',
        zIndex:         20,
        pointerEvents:  'auto',
      }}
    >
      {/* Bouton retour */}
      <button
        onClick={onBack}
        title="Retour"
        style={{
          background:   'transparent',
          border:       'none',
          color:        'var(--player-text, #F5F5F5)',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '4px 8px',
          borderRadius: 4,
          fontSize:     14,
          fontWeight:   600,
          letterSpacing: '0.3px',
          flexShrink:   0,
        }}
      >
        <ArrowLeft size={20} />
        Retour
      </button>

      {/* Titre + métadonnées */}
      <div
        style={{
          flex:        1,
          display:     'flex',
          alignItems:  'center',
          gap:         10,
          overflow:    'hidden',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color:         'var(--player-text, #F5F5F5)',
            fontSize:      15,
            fontWeight:    600,
            letterSpacing: '1.42px',
            whiteSpace:    'nowrap',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
          }}
        >
          {title}
        </span>

        {year && (
          <span style={{ color: 'var(--player-text-muted, rgba(245,245,245,0.6))', fontSize: 13 }}>
            {year}
          </span>
        )}

        {rating && (
          <span style={{ color: 'var(--player-text-muted, rgba(245,245,245,0.6))', fontSize: 13 }}>
            ★ {rating}
          </span>
        )}
      </div>

      {/* Boutons droite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {onSubtitles && (
          <button
            onClick={onSubtitles}
            title="Sous-titres"
            style={{
              background:   'transparent',
              border:       'none',
              color:        'var(--player-text, #F5F5F5)',
              cursor:       'pointer',
              padding:      '4px 6px',
              display:      'flex',
              alignItems:   'center',
              borderRadius: 4,
            }}
          >
            <Subtitles size={20} />
          </button>
        )}

        {onSettings && (
          <button
            onClick={onSettings}
            title="Paramètres"
            style={{
              background:   'transparent',
              border:       'none',
              color:        'var(--player-text, #F5F5F5)',
              cursor:       'pointer',
              padding:      '4px 6px',
              display:      'flex',
              alignItems:   'center',
              borderRadius: 4,
            }}
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
