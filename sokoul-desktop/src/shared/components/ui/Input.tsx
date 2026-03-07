// NAME — Input.tsx — Role: Text input with label/error/icon support
import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-[var(--radius-button)] border border-[rgba(255,255,255,0.12)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors duration-200',
              'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon ? 'pl-10' : undefined,
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export default Input;
