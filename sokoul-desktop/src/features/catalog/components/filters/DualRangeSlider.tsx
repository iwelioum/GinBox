import * as React from 'react';
import { YEAR_MIN, YEAR_MAX } from '../catalogFilterTypes';

const SLIDER_CSS = `
.yr-slider{appearance:none;-webkit-appearance:none;position:absolute;width:100%;
  pointer-events:none;background:transparent;margin:0;height:0;}
.yr-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:16px;height:16px;border-radius:50%;background:white;cursor:pointer;
  pointer-events:auto;border:none;box-shadow:0 1px 4px rgba(0,0,0,.4);}
.yr-slider::-webkit-slider-runnable-track{background:transparent;}
`;

interface DualRangeSliderProps {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}

export const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ value, onChange }) => {
  const [lo, hi] = value;
  const range    = YEAR_MAX - YEAR_MIN;
  const pctLo    = ((lo - YEAR_MIN) / range) * 100;
  const pctHi    = ((hi - YEAR_MIN) / range) * 100;
  const zLo      = lo >= hi - Math.round(range * 0.04) ? 5 : 3;

  return (
    <div className="relative" style={{ height: '24px' }}>
      <style>{SLIDER_CSS}</style>
      <div className="absolute rounded" style={{
        top: '50%', transform: 'translateY(-50%)',
        left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.12)',
      }} />
      <div className="absolute rounded" style={{
        top: '50%', transform: 'translateY(-50%)',
        left: `${pctLo}%`, width: `${Math.max(0, pctHi - pctLo)}%`,
        height: '3px', background: 'rgba(255,255,255,0.65)',
      }} />
      <input type="range" className="yr-slider"
        min={YEAR_MIN} max={YEAR_MAX} value={lo} style={{ zIndex: zLo }}
        onChange={(e) => { const v = Math.min(parseInt(e.target.value), hi - 1); onChange([v, hi]); }}
      />
      <input type="range" className="yr-slider"
        min={YEAR_MIN} max={YEAR_MAX} value={hi} style={{ zIndex: 4 }}
        onChange={(e) => { const v = Math.max(parseInt(e.target.value), lo + 1); onChange([lo, v]); }}
      />
    </div>
  );
};
