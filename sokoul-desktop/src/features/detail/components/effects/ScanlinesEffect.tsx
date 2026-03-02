export const ScanlinesEffect = () => (
  <div
    className="fixed inset-0 pointer-events-none z-20"
    style={{
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
      animation: 'scanlines-pulse 4s ease-in-out infinite',
    }}
  >
    <style>{`
      @keyframes scanlines-pulse {
        0%, 100% { opacity: 0.4; }
        50%       { opacity: 0.9; }
      }
    `}</style>
  </div>
);
