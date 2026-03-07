import React from 'react';

interface VideoContainerProps {
  onClick: () => void;
}

export const VideoContainer = ({ onClick }: VideoContainerProps) => (
  <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 80px)' }}>

    {/* Area where MPV renders — pointer-events: none required */}
    <div
      id="video-container"
      data-testid="video-container"
      style={{
        position:      'absolute',
        inset:         0,
        background:    'transparent',
        pointerEvents: 'none',
      }}
    />

    {/* Clickable layer for toggle play/pause — above the MPV area */}
    <div
      data-testid="video-click-zone"
      onClick={onClick}
      style={{
        position: 'absolute',
        inset:    0,
        cursor:   'pointer',
        zIndex:   5,
      }}
    />
  </div>
);
