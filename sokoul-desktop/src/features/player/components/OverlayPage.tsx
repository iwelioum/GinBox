/**
 * Transparent full-screen overlay window rendered on top of the MPV player.
 * Top zone (header + back) and bottom zone (controls) share the same
 * showControls visibility state. The center is click-through to MPV.
 */

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useMpv } from '../hooks/useMpv';
import { usePlayerInfo } from '../hooks/usePlayerInfo';
import { useMouseIdle } from '../../../shared/hooks/useMouseIdle';
import { useSwitchSource } from '../hooks/useSwitchSource';
import { HeaderOverlay } from './HeaderOverlay';
import { ProgressBar } from './ProgressBar';
import { ControlsBar } from './ControlsBar';
import { AudioPanel } from './AudioPanel';
import { SubtitlesPanel } from './SubtitlesPanel';
import { SourcePanel, SourceButton } from './SourcePanel';
import { PrevEpisodeCard, NextEpisodeCard } from './EpisodeOverlay';
import '@/styles/player.tokens.css';

export default function OverlayPage() {
  /** Force transparent background before first paint (Electron overlay requirement) */
  useLayoutEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
  }, []);

  const {
    play, pause, seekTo, setVolume, setSpeed,
    loadTracks, selectAudioTrack, selectSubTrack, disableSubs,
    audioTracks, subTracks,
    position, duration, isPlaying, isActive,
  } = useMpv();

  const { playerInfo, sources, currentSource, setSources, setCurrentSource } = usePlayerInfo();
  const { showControls, setShowControls, handleMouseEnter, handleMouseLeave } = useMouseIdle(isActive);

  const {
    switchingSource, refreshingSources, switchError,
    groupedSources, isCurrent,
    handleSwitchSource, handleRefreshSources, clearSwitchError,
  } = useSwitchSource({ playerInfo, sources, currentSource, setSources, setCurrentSource });

  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(100);
  const [showAudio, setShowAudio] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);

  /** Tell Electron whether to capture mouse events on this overlay */
  useEffect(() => {
    window.overlay?.capture(showControls || sourcePanelOpen);
  }, [showControls, sourcePanelOpen]);

  /** Reset sub-panels when MPV deactivates */
  useEffect(() => {
    if (!isActive) {
      setShowAudio(false);
      setShowSubs(false);
      setSourcePanelOpen(false);
      setShowSpeedMenu(false);
    }
  }, [isActive]);

  const closeSourcePanel = useCallback(() => {
    setSourcePanelOpen(false);
    clearSwitchError();
  }, [clearSwitchError]);

  const handleMuteToggle = () => {
    if (isMuted) { setIsMuted(false); setVolume(prevVolume); }
    else { setPrevVolume(volume); setIsMuted(true); setVolume(0); }
  };

  const handleVolumeChange = (n: number) => {
    setVolumeState(n);
    setVolume(n);
    if (n > 0 && isMuted) setIsMuted(false);
  };

  const handleSkipBack = () => seekTo(Math.max(0, position - 10));
  const handleSkipForward = () => seekTo(position + 10);

  const handleToggleAudio = () => {
    if (!showAudio) loadTracks();
    setShowAudio(p => !p);
    setShowSubs(false);
  };

  const handleToggleSubs = () => {
    if (!showSubs) loadTracks();
    setShowSubs(p => !p);
    setShowAudio(false);
    setShowSpeedMenu(false);
  };

  const handleToggleSpeed = () => {
    setShowSpeedMenu(p => !p);
    setShowAudio(false);
    setShowSubs(false);
  };

  const handleSpeedChange = (rate: number) => {
    setCurrentSpeed(rate);
    void setSpeed(rate);
    setShowSpeedMenu(false);
  };

  const handleSourcePanelOpen = () => {
    if (!isActive || sources.length === 0) return;
    setShowControls(true);
    setSourcePanelOpen(true);
    clearSwitchError();
  };

  const handleBack = () => {
    window.overlay?.back();
  };

  const sendEpisodeCommand = useCallback((action: 'nextEpisode' | 'prevEpisode' | 'cancelAutoplay') => {
    const bc = new BroadcastChannel('player_commands');
    bc.postMessage({ action });
    bc.close();
  }, []);

  const uiVisible: React.CSSProperties = {
    opacity: showControls ? 1 : 0,
    pointerEvents: showControls ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  };

  return (
    <div className="w-screen h-screen flex flex-col" style={{ pointerEvents: 'none', background: 'transparent' }}>
      {isActive && sources.length > 0 && (
        <SourceButton sourceCount={sources.length} onClick={handleSourcePanelOpen} />
      )}

      {playerInfo.prevEpisode && isActive && (
        <PrevEpisodeCard
          episode={playerInfo.prevEpisode as import('../../../shared/types/index').EpisodeVideo}
          switchingEpisode={playerInfo.switchingEpisode ?? false}
          onSwitch={() => sendEpisodeCommand('prevEpisode')}
        />
      )}

      {playerInfo.nextEpisode && isActive && (
        <NextEpisodeCard
          episode={playerInfo.nextEpisode as import('../../../shared/types/index').EpisodeVideo}
          switchingEpisode={playerInfo.switchingEpisode ?? false}
          autoplayCountdown={playerInfo.autoplayCountdown ?? null}
          onSwitch={() => sendEpisodeCommand('nextEpisode')}
          onCancelAutoplay={() => sendEpisodeCommand('cancelAutoplay')}
        />
      )}

      {sourcePanelOpen && (
        <div
          className="absolute inset-0 z-[35] bg-black/25"
          onClick={closeSourcePanel}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {sourcePanelOpen && (
        <SourcePanel
          sources={sources}
          groupedSources={groupedSources}
          switchingSource={switchingSource}
          refreshingSources={refreshingSources}
          switchError={switchError}
          isCurrent={isCurrent}
          onSwitchSource={(s) => {
            void handleSwitchSource(s)
              .then(closeSourcePanel)
              .catch(() => { closeSourcePanel(); });
          }}
          onRefreshSources={() => { void handleRefreshSources(); }}
          onClose={closeSourcePanel}
        />
      )}

      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', ...uiVisible }}
      >
        <HeaderOverlay
          title={playerInfo.title}
          year={playerInfo.year || undefined}
          rating={playerInfo.rating || undefined}
          episodeTitle={playerInfo.episodeTitle || undefined}
          onBack={handleBack}
        />
      </div>

      <div className="flex-1" style={{ pointerEvents: 'none' }} />

      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col gap-4 px-6 pb-6"
        style={{
          /* CSS custom properties from player.tokens.css drive overlay gradient */
          background: 'var(--player-overlay-bot, linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%))',
          minHeight: 'var(--player-overlay-h, 120px)',
          justifyContent: 'flex-end',
          boxSizing: 'border-box',
          ...uiVisible,
        }}
      >
        {showAudio && (
          <AudioPanel
            tracks={audioTracks}
            onSelect={async (id) => { try { await selectAudioTrack(id); } catch {} setShowAudio(false); }}
            onClose={() => setShowAudio(false)}
          />
        )}
        {showSubs && (
          <SubtitlesPanel
            tracks={subTracks}
            onSelect={async (id) => { try { await selectSubTrack(id); } catch {} setShowSubs(false); }}
            onDisable={async () => { try { await disableSubs(); } catch {} setShowSubs(false); }}
            onClose={() => setShowSubs(false)}
          />
        )}
        <ProgressBar position={position} duration={duration} onSeek={seekTo} />
        <ControlsBar
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
          onPlay={async () => { await play(); }}
          onPause={async () => { await pause(); }}
          onSkipBack={handleSkipBack}
          onSkipForward={handleSkipForward}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={handleMuteToggle}
          onSubtitles={handleToggleSubs}
          onAudio={handleToggleAudio}
          onSettings={handleToggleSpeed}
        />
        {showSpeedMenu && (
          <div className="absolute bottom-20 right-4 bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl p-2 flex flex-col gap-0.5 z-50 min-w-[120px]">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  currentSpeed === rate
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {rate === 1 ? 'Normal' : `${rate}×`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
