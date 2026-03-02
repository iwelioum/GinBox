import { useMemo } from 'react';

interface RainDrop {
  id:     number;
  left:   number;
  delay:  number;
  height: number;
}

export const RainEffect = () => {
  const drops = useMemo<RainDrop[]>(() => (
    Array.from({ length: 30 }, (_, i) => ({
      id:     i,
      left:   Math.random() * 100,
      delay:  Math.random() * 2,
      height: Math.random() * 60 + 40,
    }))
  ), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes rain-fall {
          0%   { transform: translateY(-100px); opacity: 0; }
          10%  { opacity: 0.15; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
      `}</style>
      {drops.map(d => (
        <div
          key={d.id}
          className="absolute w-px"
          style={{
            left:             `${d.left}%`,
            top:              0,
            height:           d.height,
            background:       'linear-gradient(to bottom, transparent, rgba(160,200,240,0.6))',
            animation:        `rain-fall ${1.2 + d.delay}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
