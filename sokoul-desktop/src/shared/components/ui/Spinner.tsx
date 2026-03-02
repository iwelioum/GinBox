// NOM — Spinner.tsx — Rôle: Indicateur de chargement
// RÈGLES : Doit être simple et utiliser la couleur d'accent.

import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 24, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
        className={cn('animate-spin', className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };
