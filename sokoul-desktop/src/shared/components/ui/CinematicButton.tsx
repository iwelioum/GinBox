import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface CinematicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  primary: `
    bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)]
    text-white shadow-lg
    hover:shadow-[var(--depth-accent-glow)] hover:scale-[1.04]
  `,
  secondary: `
    bg-[var(--color-bg-overlay)] border border-[var(--color-border)]
    text-[var(--color-text-primary)]
    hover:border-[var(--color-border-medium)] hover:scale-[1.02]
  `,
  ghost: `
    bg-transparent text-[var(--color-text-muted)]
    hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]
  `,
};

export function CinematicButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: CinematicButtonProps) {
  return (
    <button
      {...props}
      className={`
        px-6 py-3 rounded-xl font-medium text-sm
        transition-all duration-200 active:scale-[0.97]
        focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
