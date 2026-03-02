import { useMemo } from 'react';

interface Petal {
  id:       number;
  left:     number;
  size:     number;
  duration: number;
  delay:    number;
  rotate:   number;
}

export const PetalsEffect = () => {
  const petals = useMemo<Petal[]>(() => (
    Array.from({ length: 20 }, (_, i) => ({
      id:       i,
      left:     Math.random() * 100,
      size:     Math.random() * 8 + 5,
      duration: Math.random() * 6 + 6,
      delay:    Math.random() * 8,
      rotate:   Math.random() * 360,
    }))
  ), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes petal-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
      {petals.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left:             `${p.left}%`,
            top:              0,
            width:            p.size,
            height:           p.size * 0.6,
            background:       'var(--accent, #6366f1)',
            opacity:          0.5,
            borderRadius:     '50% 0 50% 0',
            transform:        `rotate(${p.rotate}deg)`,
            animation:        `petal-fall ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
