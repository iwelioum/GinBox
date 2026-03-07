// NAME — EmptyState.tsx — Role: Empty content placeholder
import * as React from 'react';
import { Button } from './Button';

const cn = (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' ');

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      {icon && <div className="text-[var(--color-text-muted)] [&>svg]:h-12 [&>svg]:w-12">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
      )}
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
