// NAME — Button.tsx — Role: UI button component
// RULES: Must support 'primary' (Play) and 'secondary' (My list) variants
import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leftIcon?: React.ReactNode;
  size?: 'default' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', leftIcon, children, size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg-base)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]';

    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
      secondary: 'bg-transparent text-[var(--color-text-primary)] border border-white/10 hover:bg-white/10',
      ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-white hover:bg-white/10',
    };

    const sizeClasses: Record<string, string> = {
      default: 'px-6 py-3 text-base h-10',
      lg: 'px-6 py-3 text-base h-12',
      icon: 'w-10 h-10 p-0',
    };

    return (
      <button className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)} ref={ref} {...props}>
        {leftIcon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
