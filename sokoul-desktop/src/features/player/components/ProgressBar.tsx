// ProgressBar.tsx — Player progress bar
// Hover: height 3px → 5px + scrubber visible

import React, { useState } from 'react';
import { formatTime } from '../utils/formatTime';

interface ProgressBarProps {
  position: number;  // current seconds
  duration: number;  // total duration in seconds
  onSeek:   (seconds: number) => void;
}

export const ProgressBar = ({ position, duration, onSeek }: ProgressBarProps) => {
  const [hovered, setHovered] = useState(false);
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Clickable bar */}
      <div
        data-testid="progress-bar"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width:        '100%',
          height:       hovered ? 'var(--player-bar-h-hover, 5px)' : 'var(--player-bar-h, 3px)',
          background:   'var(--player-progress-bg, rgba(255,255,255,0.15))',
          borderRadius: 4,
          cursor:       'pointer',
          position:     'relative',
          transition:   'height var(--player-timing, 0.2s) var(--player-ease, ease)',
        }}
      >
        {/* Fill */}
        <div
          style={{
            width:        `${progress}%`,
            height:       '100%',
            background:   'var(--player-progress-fill, #F5F5F5)',
            borderRadius: 4,
            transition:   'width 0.3s linear',
            position:     'relative',
          }}
        >
          {/* Scrubber — visible only on hover */}
          {hovered && (
            <div
              style={{
                position:      'absolute',
                right:         -6,
                top:           '50%',
                transform:     'translateY(-50%)',
                width:         'var(--player-scrubber-sz, 12px)',
                height:        'var(--player-scrubber-sz, 12px)',
                background:    '#fff',
                borderRadius:  '50%',
                pointerEvents: 'none',
                boxShadow:     '0 0 4px rgba(0,0,0,0.4)',
              }}
            />
          )}
        </div>
      </div>

      {/* Current time / duration */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span
          style={{
            color:              'var(--player-text-muted, rgba(245,245,245,0.6))',
            fontSize:           12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(position)}
        </span>
        <span
          style={{
            color:              'var(--player-text-muted, rgba(245,245,245,0.6))',
            fontSize:           12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
