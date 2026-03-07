// NAME — Toggle.tsx — Role: Pill-shaped toggle switch
import * as React from 'react';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={cn('inline-flex items-center gap-3', disabled && 'cursor-not-allowed opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
          checked ? 'bg-[var(--color-accent)]' : 'bg-[rgba(255,255,255,0.15)]',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      {label && <span className="text-sm text-[var(--color-text-primary)]">{label}</span>}
    </label>
  );
}

export default Toggle;
