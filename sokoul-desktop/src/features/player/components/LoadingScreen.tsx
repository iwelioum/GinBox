// LoadingScreen.tsx — Player loading screen
// Simulated progress 0% → 85% during MPV buffering
// Goes to 100% when visible=false (MPV ready)

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingScreenProps {
  title:   string;
  poster:  string;
  visible: boolean;
}

// Simulated progress steps — spaced ~85ms apart
const STEPS = [10, 20, 32, 45, 56, 65, 72, 78, 83, 85] as const;

export const LoadingScreen = ({ title, poster, visible }: LoadingScreenProps) => {
  const { t } = useTranslation();
  const [percent,   setPercent]   = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Simulated progress during loading
  useEffect(() => {
    if (!visible) return;

    setPercent(0);
    setDismissed(false);

    const timers = STEPS.map((val, i) =>
      setTimeout(() => setPercent(val), i * 85)
    );

    return () => timers.forEach(clearTimeout);
  }, [visible]);

  // When MPV is ready: go to 100% then hide after the transition
  useEffect(() => {
    if (visible) return;

    setPercent(100);
    const t = setTimeout(() => setDismissed(true), 400);
    return () => clearTimeout(t);
  }, [visible]);

  if (dismissed) return null;

  return (
    <div
      data-testid="loading-screen"
      style={{
        position:       'absolute',
        inset:          0,
        zIndex:         20,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'linear-gradient(to bottom, #0a0a0a, #1a1a2e)',
        transition:     'opacity 0.35s ease',
        opacity:        visible ? 1 : 0,
        pointerEvents:  visible ? 'auto' : 'none',
      }}
    >
      {/* Blurred background */}
      {poster && (
        <div
          style={{
            position:           'absolute',
            inset:              0,
            backgroundImage:    `url(${poster})`,
            backgroundSize:     'cover',
            backgroundPosition: 'center',
            filter:             'blur(20px) brightness(0.25)',
            zIndex:             0,
          }}
        />
      )}

      {/* Centered content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {poster && (
          <img
            src={poster}
            alt={title}
            data-testid="loading-poster"
            style={{
              width:        180,
              borderRadius: 8,
              boxShadow:    '0 8px 32px rgba(0,0,0,0.8)',
              marginBottom: 24,
            }}
          />
        )}

        <p
          style={{
            color:         '#F5F5F5',
            fontSize:      16,
            fontWeight:    600,
            margin:        '0 0 20px',
            letterSpacing: '0.3px',
          }}
        >
          {title}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width:        200,
            height:       3,
            background:   'rgba(255,255,255,0.1)',
            borderRadius: 2,
            overflow:     'hidden',
            margin:       '0 auto 10px',
          }}
        >
          <div
            style={{
              width:        `${percent}%`,
              height:       '100%',
              background:   '#F5F5F5',
              borderRadius: 2,
              transition:   'width 0.15s ease',
            }}
          />
        </div>

        <p style={{ color: 'rgba(245,245,245,0.5)', fontSize: 12, margin: 0 }}>
          {percent < 85
            ? t('player.loadingPercent', { percent })
            : percent < 100
            ? t('player.startingPlayback')
            : t('player.ready')
          }
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
