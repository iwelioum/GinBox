import { useMemo } from 'react';

interface Star {
  id:       number;
  top:      number;
  left:     number;
  size:     number;
  duration: number;
  delay:    number;
}

export const StarsEffect = () => {
  const stars = useMemo<Star[]>(() => (
    Array.from({ length: 40 }, (_, i) => ({
      id:       i,
      top:      Math.random() * 100,
      left:     Math.random() * 100,
      size:     Math.random() * 2 + 1,
      duration: Math.random() * 3 + 1.5,
      delay:    Math.random() * 4,
    }))
  ), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.1; }
          50%       { opacity: 0.8; }
        }
      `}</style>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top:       `${s.top}%`,
            left:      `${s.left}%`,
            width:     s.size,
            height:    s.size,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
