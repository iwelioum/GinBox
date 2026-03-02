// NOM — CarouselDots.tsx — Rôle: Indicateurs pour carousel Hero
// RÈGLES : Point actif plus large, inactifs plus petits/transparents.

import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
}

const CarouselDots: React.FC<CarouselDotsProps> = ({
  count,
  activeIndex,
  onDotClick,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          aria-label={`Go to slide ${index + 1}`}
          onClick={() => onDotClick(index)}
          className={cn(
            'h-2 rounded-pill transition-all duration-300',
            index === activeIndex ? 'w-5 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
          )}
        />
      ))}
    </div>
  );
};

export { CarouselDots };
