// ControlsBar.tsx — Barre de controles du lecteur

import { useState } from 'react';
import {
  Play, Pause,
  SkipBack, SkipForward,
  Volume2, VolumeX,
  Subtitles, Music,
  Maximize, Minimize,
  Settings,
} from 'lucide-react';

export interface ControlsBarProps {
  isPlaying:       boolean;
  volume:          number;
  isMuted:         boolean;
  onPlay:          () => void;
  onPause:         () => void;
  onSkipBack:      () => void;
  onSkipForward:   () => void;
  onVolumeChange:  (n: number) => void;
  onMuteToggle:    () => void;
  onSubtitles:     () => void;
  onAudio:         () => void;
  onSettings:      () => void;
  // onFullscreen géré en interne — plus besoin de prop externe
}

const btnBase: React.CSSProperties = {
  background:   'transparent',
  border:       'none',
  color:        'var(--player-text, #F5F5F5)',
  cursor:       'pointer',
  padding:      '4px 6px',
  display:      'flex',
  alignItems:   'center',
  borderRadius: 4,
  flexShrink:   0,
  transition:   'opacity var(--player-timing, 0.2s)',
};

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title:   string;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...btnBase, opacity: hov ? 0.65 : 1 }}
    >
      {children}
    </button>
  );
}

export function ControlsBar({
  isPlaying,
  volume,
  isMuted,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  onMuteToggle,
  onSubtitles,
  onAudio,
  onSettings,
}: ControlsBarProps) {
  const [volumeExpanded, setVolumeExpanded] = useState(false);
  const [isFs,           setIsFs]           = useState(false);
  const sz = 22;

  const handleFullscreen = async () => {
    await window.overlay?.toggleFullscreen();
    const state = await window.overlay?.isFullscreen();
    setIsFs(!!state);
  };

  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        4,
        height:     36,
      }}
    >
      <IconBtn onClick={onSkipBack}  title="Reculer de 10s">
        <SkipBack size={sz} />
      </IconBtn>

      <IconBtn onClick={isPlaying ? onPause : onPlay} title={isPlaying ? 'Pause' : 'Lecture'}>
        {isPlaying ? <Pause size={sz} /> : <Play size={sz} />}
      </IconBtn>

      <IconBtn onClick={onSkipForward} title="Avancer de 10s">
        <SkipForward size={sz} />
      </IconBtn>

      <div
        onMouseEnter={() => setVolumeExpanded(true)}
        onMouseLeave={() => setVolumeExpanded(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <IconBtn onClick={onMuteToggle} title={isMuted ? 'Activer le son' : 'Couper le son'}>
          {isMuted || volume === 0 ? <VolumeX size={sz} /> : <Volume2 size={sz} />}
        </IconBtn>

        <div
          style={{
            width:      volumeExpanded ? 80 : 0,
            overflow:   'hidden',
            transition: 'width var(--player-timing, 0.2s) var(--player-ease, ease)',
          }}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={e => onVolumeChange(Number(e.target.value))}
            style={{
              width:       80,
              accentColor: '#fff',
              cursor:      'pointer',
              display:     'block',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <IconBtn onClick={onSubtitles} title="Sous-titres (CC)">
        <Subtitles size={sz} />
      </IconBtn>

      <IconBtn onClick={onAudio} title="Piste audio">
        <Music size={sz} />
      </IconBtn>

      <IconBtn onClick={handleFullscreen} title={isFs ? 'Fenêtré' : 'Plein écran'}>
        {isFs ? <Minimize size={sz} /> : <Maximize size={sz} />}
      </IconBtn>

      <IconBtn onClick={onSettings} title="Paramètres">
        <Settings size={sz} />
      </IconBtn>
    </div>
  );
}
