interface DustEffectProps {
  intensity?: number; // 0.0 → 1.0
}

export const DustEffect = ({ intensity = 0.04 }: DustEffectProps) => (
  <div
    className="fixed inset-0 pointer-events-none z-10"
    style={{ animation: 'dust-flicker 8s ease-in-out infinite' }}
  >
    <style>{`
      @keyframes dust-flicker {
        0%, 100% { opacity: ${intensity}; }
        25%       { opacity: ${intensity * 1.5}; }
        50%       { opacity: ${intensity * 0.6}; }
        75%       { opacity: ${intensity * 1.3}; }
      }
    `}</style>
    <svg
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="grain-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect
        width="100%"
        height="100%"
        filter="url(#grain-noise)"
        opacity="1"
      />
    </svg>
  </div>
);
