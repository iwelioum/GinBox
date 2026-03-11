// HeaderOverlay.tsx — Player top bar
// Rendered in PlayerPage (main window), not the overlay

import { useTranslation } from 'react-i18next';
import { ArrowLeft, Subtitles, Settings } from 'lucide-react';

export interface HeaderOverlayProps {
  title:          string;
  episodeTitle?:  string;
  year?:          string;
  rating?:        string;
  onBack:         () => void;
  onSubtitles?:   () => void;
  onSettings?:    () => void;
}

export function HeaderOverlay({
  title,
  episodeTitle,
  year,
  rating,
  onBack,
  onSubtitles,
  onSettings,
}: HeaderOverlayProps) {
  const { t } = useTranslation();
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
      {/* Back button */}
      <button
        onClick={onBack}
        title={t('player.back')}
        style={{
          background:   'transparent',
          border:       'none',
          color:        'var(--color-text-primary)',
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
        {t('player.back')}
      </button>

      {/* Title + metadata */}
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
          <span
            style={{
              color:         'var(--color-text-primary)',
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

          {episodeTitle && (
            <span style={{ color: 'var(--player-text-muted, rgba(245,245,245,0.6))', fontSize: 12, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {episodeTitle}
            </span>
          )}
        </div>

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

      {/* Right buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {onSubtitles && (
          <button
            onClick={onSubtitles}
            title={t('player.subtitlesCC')}
            style={{
              background:   'transparent',
              border:       'none',
              color:        'var(--color-text-primary)',
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
            title={t('player.settings')}
            style={{
              background:   'transparent',
              border:       'none',
              color:        'var(--color-text-primary)',
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
