import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] font-[var(--font-display)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl leading-6">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
