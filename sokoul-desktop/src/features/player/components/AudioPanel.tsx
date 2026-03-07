// AudioPanel.tsx — Audio track selector
// Positioned absolute above the ControlsBar (bottom: 100%)

import { useTranslation } from 'react-i18next';
import type { MpvTrack } from '@/shared/types/ipc';
import i18n from '@/shared/i18n';

interface AudioPanelProps {
  tracks:   MpvTrack[];
  onSelect: (id: number) => void;
  onClose:  () => void;
}

function trackLabel(track: MpvTrack): string {
  if (track.lang && track.codec) return `${track.lang.toUpperCase()} — ${track.codec.toUpperCase()}`;
  if (track.lang)                return track.lang.toUpperCase();
  if (track.title)               return track.title;
  return i18n.t('player.trackLabel', { id: track.id });
}

export function AudioPanel({ tracks, onSelect, onClose }: AudioPanelProps) {
  const { t } = useTranslation();
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
      {/* Title */}
      <p style={{
        color:         'rgba(245,245,245,0.5)',
        fontSize:      11,
        letterSpacing: '1.42px',
        padding:       '0 16px 8px',
        textTransform: 'uppercase',
        margin:        0,
      }}>
        {t('player.audioTrackTitle')}
      </p>

      {/* Case: no tracks */}
      {tracks.length === 0 && (
        <p style={{
          color:   'rgba(245,245,245,0.35)',
          fontSize: 13,
          padding: '8px 16px',
          margin:  0,
        }}>
          {t('player.noTracksAvailable')}
        </p>
      )}

      {/* Track list */}
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
          {/* Active indicator */}
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
    </div>
  );
}
