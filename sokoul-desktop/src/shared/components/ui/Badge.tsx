// NOM — Badge.tsx — Rôle: Composant badge UI
// RÈGLES : Doit supporter les variantes pour 'nouveau', 'durée', etc.

import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

type BadgeVariant = 'default' | 'new' | 'duration';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseClasses = 'font-semibold';

    const variantClasses: Record<BadgeVariant, string> = {
      default: 'text-text-secondary',
      new: 'bg-[#ec1d24] text-white uppercase text-xs px-2 py-1 rounded-card absolute top-2 left-2',
      duration: 'bg-black/70 text-white text-xs px-2 py-1 rounded-sm absolute bottom-2 right-2',
    };

    return (
      <div className={cn(baseClasses, variantClasses[variant], className)} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
