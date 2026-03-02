// NOM — Button.tsx — Rôle: Composant bouton UI
// RÈGLES : Doit supporter les variantes 'primary' (Lecture) et 'secondary' (Ma liste)
import * as React from 'react';
import { Play } from 'lucide-react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'secondary' | 'ghost'; // Added 'ghost' variant

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leftIcon?: React.ReactNode;
  size?: 'default' | 'icon'; // Added size prop
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', leftIcon, children, size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-button px-6 py-3 text-base font-bold uppercase tracking-wider transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50';

    const variantClasses: Record<ButtonVariant, string> = {
      primary: 'bg-white text-bg-primary hover:bg-white/85',
      secondary: 'bg-[rgba(255,255,255,0.18)] text-text-primary border border-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.28)]',
      ghost: 'bg-transparent text-text-secondary hover:bg-white/10', // Added ghost variant styles
    };

    const sizeClasses: Record<string, string> = {
      default: 'px-6 py-3',
      icon: 'w-10 h-10 p-0', // For icon buttons
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
