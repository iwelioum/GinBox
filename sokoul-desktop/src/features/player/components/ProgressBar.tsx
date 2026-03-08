// ProgressBar.tsx — Player progress bar
// Hover: height 3px → 5px + scrubber visible

import React, { useState } from 'react';
import { formatTime } from '../utils/formatTime';

interface ProgressBarProps {
  position: number;  // current seconds
  duration: number;  // total duration in seconds
  onSeek:   (seconds: number) => void;
}

export const ProgressBar = ({ position, duration, onSeek }: ProgressBarProps) => {
  const [hovered, setHovered] = useState(false);
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  return (
    <div className="w-full">
      {/* Clickable bar */}
      <div
        data-testid="progress-bar"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          group/progress w-full cursor-pointer relative rounded-full transition-all duration-150
          ${hovered ? 'h-[5px]' : 'h-[3px]'}
          bg-white/15
        `}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Fill */}
        <div
          className="h-full bg-accent rounded-full relative transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        >
          {/* Scrubber — visible only on hover */}
          {hovered && (
            <div
              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* Time Display */}
      <div className="flex justify-center mt-2">
        <span className="text-text-secondary text-sm font-mono">
          {formatTime(position)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
