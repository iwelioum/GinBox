// SubtitlesPanel.tsx — Sélecteur de piste de sous-titres
// Inclut "Désactivés" en tête de liste

import type { MpvTrack } from '../../../ipc';

interface SubtitlesPanelProps {
  tracks:    MpvTrack[];
  onSelect:  (id: number) => void;
  onDisable: () => void;
  onClose:   () => void;
}

function trackLabel(track: MpvTrack): string {
  if (track.lang && track.codec) return `${track.lang.toUpperCase()} — ${track.codec.toUpperCase()}`;
  if (track.lang)                return track.lang.toUpperCase();
  if (track.title)               return track.title;
  return `Piste ${track.id}`;
}

export function SubtitlesPanel({ tracks, onSelect, onDisable, onClose }: SubtitlesPanelProps) {
  // "Désactivés" est actif si aucune piste sub n'est sélectionnée
  const noneActive = tracks.length === 0 || tracks.every(t => !t.selected);

  return (
    <div
      style={{
        position:     'absolute',
        right:        16,
        bottom:       '100%',
        marginBottom: 8,
        width:        260,
        background:   '#0d0d0d',
        border:       '1px solid rgba(202,202,202,0.2)',
        borderRadius: 4,
        padding:      '12px 0',
        zIndex:       50,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Titre */}
      <p style={{
        color:         'rgba(245,245,245,0.5)',
        fontSize:      11,
        letterSpacing: '1.42px',
        padding:       '0 16px 8px',
        textTransform: 'uppercase',
        margin:        0,
      }}>
        Sous-titres
      </p>

      {/* Option Désactivés */}
      <div
        onClick={() => { onDisable(); onClose(); }}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          padding:    '10px 16px',
          cursor:     'pointer',
          color:      noneActive ? '#F5F5F5' : 'rgba(245,245,245,0.6)',
          fontWeight: noneActive ? 600 : 400,
          fontSize:   14,
          background: noneActive ? 'rgba(255,255,255,0.07)' : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background =
            noneActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background =
            noneActive ? 'rgba(255,255,255,0.07)' : 'transparent';
        }}
      >
        <span style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   noneActive ? '#F5F5F5' : 'transparent',
          border:       '1px solid rgba(245,245,245,0.4)',
          flexShrink:   0,
        }} />
        Désactivés
      </div>

      {/* Séparateur */}
      {tracks.length > 0 && (
        <div style={{
          height:  1,
          margin:  '4px 16px',
          background: 'rgba(255,255,255,0.08)',
        }} />
      )}

      {/* Liste des pistes */}
      {tracks.map(track => (
        <div
          key={track.id}
          onClick={() => { onSelect(track.id); onClose(); }}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        10,
            padding:    '10px 16px',
            cursor:     'pointer',
            color:      track.selected ? '#F5F5F5' : 'rgba(245,245,245,0.6)',
            fontWeight: track.selected ? 600 : 400,
            fontSize:   14,
            background: track.selected ? 'rgba(255,255,255,0.07)' : 'transparent',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.background =
              track.selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.background =
              track.selected ? 'rgba(255,255,255,0.07)' : 'transparent';
          }}
        >
          <span style={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            background:   track.selected ? '#F5F5F5' : 'transparent',
            border:       '1px solid rgba(245,245,245,0.4)',
            flexShrink:   0,
          }} />
          {trackLabel(track)}
        </div>
      ))}

      {/* Cas : aucune piste disponible (sauf l'option désactivé) */}
      {tracks.length === 0 && (
        <p style={{
          color:   'rgba(245,245,245,0.35)',
          fontSize: 13,
          padding: '4px 16px 0',
          margin:  0,
        }}>
          Aucune piste disponible
        </p>
      )}
    </div>
  );
}
