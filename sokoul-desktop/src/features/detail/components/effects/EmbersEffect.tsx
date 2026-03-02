import { useMemo } from 'react';

interface Ember {
  id:       number;
  left:     number;
  size:     number;
  duration: number;
  delay:    number;
  drift:    number;
}

export const EmbersEffect = () => {
  const embers = useMemo<Ember[]>(() => (
    Array.from({ length: 25 }, (_, i) => ({
      id:       i,
      left:     Math.random() * 100,
      size:     Math.random() * 4 + 2,
      duration: Math.random() * 4 + 3,
      delay:    Math.random() * 6,
      drift:    (Math.random() - 0.5) * 60,
    }))
  ), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes ember-rise {
          0%   { transform: translateY(110vh) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.9; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(-10vh) translateX(var(--drift)) scale(0.2); opacity: 0; }
        }
      `}</style>
      {embers.map(e => (
        <div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left:             `${e.left}%`,
            bottom:           0,
            width:            e.size,
            height:           e.size,
            background:       `radial-gradient(circle, #ffaa44, #ff4400)`,
            boxShadow:        `0 0 ${e.size * 2}px #ff6600`,
            ['--drift' as string]: `${e.drift}px`,
            animation:        `ember-rise ${e.duration}s ease-out ${e.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
