import { useEffect, useRef, useState } from 'react';

export const TorchEffect = () => {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [size, setSize] = useState(180);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const speed = Math.hypot(
        e.clientX - lastPos.current.x,
        e.clientY - lastPos.current.y
      );
      setSize(Math.min(180 + speed * 2, 320));
      setPos({ x: e.clientX, y: e.clientY });
      lastPos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20
                 transition-[background] duration-75"
      style={{
        background: `radial-gradient(
          circle ${size}px at ${pos.x}px ${pos.y}px,
          transparent 0%,
          rgba(0,0,0,0.92) 100%
        )`,
      }}
    />
  );
};
