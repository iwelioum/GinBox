// ControlsBar.tsx — Player controls bar

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  // onFullscreen handled internally — no need for external prop
}

function IconBtn({
  onClick,
  title,
  children,
  isActive = false,
}: {
  onClick: () => void;
  title:   string;
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        text-white/70 hover:text-white hover:scale-110 
        transition-all duration-150 ease-out
        flex items-center justify-center
        p-2 rounded-full
        ${isActive ? 'text-accent' : ''}
      `}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </button>
  );
}

function VolumeSlider({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  expanded 
}: { 
  volume: number; 
  isMuted: boolean; 
  onVolumeChange: (n: number) => void;
  expanded: boolean;
}) {
  return (
    <div 
      className={`
        overflow-hidden transition-all duration-150 ease-out
        ${expanded ? 'w-20' : 'w-0'}
      `}
    >
      <div className="relative w-20 h-1 bg-white/15 rounded-full">
        <div 
          className="absolute left-0 top-0 h-full bg-accent rounded-full"
          style={{ width: `${isMuted ? 0 : volume}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={e => onVolumeChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm"
          style={{ left: `${Math.max(0, Math.min(100, isMuted ? 0 : volume))}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
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
  const { t } = useTranslation();
  const [volumeExpanded, setVolumeExpanded] = useState(false);
  const [isFs,           setIsFs]           = useState(false);

  const handleFullscreen = async () => {
    await window.overlay?.toggleFullscreen();
    const state = await window.overlay?.isFullscreen();
    setIsFs(!!state);
  };

  return (
    <div className="flex items-center justify-between h-12" style={{ pointerEvents: 'auto' }}>
      {/* Left Controls */}
      <div className="flex items-center gap-2">
        <IconBtn onClick={onSkipBack} title={t('player.rewind')}>
          <SkipBack className="w-[22px] h-[22px]" />
        </IconBtn>

        <IconBtn 
          onClick={isPlaying ? onPause : onPlay} 
          title={isPlaying ? t('player.pause') : t('player.play')}
          isActive={isPlaying}
        >
          {isPlaying ? <Pause className="w-[22px] h-[22px]" /> : <Play className="w-[22px] h-[22px]" />}
        </IconBtn>

        <IconBtn onClick={onSkipForward} title={t('player.forward')}>
          <SkipForward className="w-[22px] h-[22px]" />
        </IconBtn>

        {/* Volume */}
        <div 
          className="flex items-center gap-2"
          onMouseEnter={() => setVolumeExpanded(true)}
          onMouseLeave={() => setVolumeExpanded(false)}
        >
          <IconBtn onClick={onMuteToggle} title={isMuted ? t('player.unmute') : t('player.mute')}>
            {isMuted || volume === 0 ? <VolumeX className="w-[22px] h-[22px]" /> : <Volume2 className="w-[22px] h-[22px]" />}
          </IconBtn>

          <VolumeSlider 
            volume={volume} 
            isMuted={isMuted} 
            onVolumeChange={onVolumeChange}
            expanded={volumeExpanded}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <IconBtn onClick={onSubtitles} title={t('player.subtitlesCC')}>
          <Subtitles className="w-[22px] h-[22px]" />
        </IconBtn>

        <IconBtn onClick={onAudio} title={t('player.audioTrack')}>
          <Music className="w-[22px] h-[22px]" />
        </IconBtn>

        <IconBtn onClick={handleFullscreen} title={isFs ? t('player.windowed') : t('player.fullscreen')}>
          {isFs ? <Minimize className="w-[22px] h-[22px]" /> : <Maximize className="w-[22px] h-[22px]" />}
        </IconBtn>

        <IconBtn onClick={onSettings} title={t('player.settings')}>
          <Settings className="w-[22px] h-[22px]" />
        </IconBtn>
      </div>
    </div>
  );
}
