import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function GlassPanel({ children, className = '', as: Tag = 'div' }: GlassPanelProps) {
  return (
    <Tag
      className={`
        bg-[var(--color-bg-glass)] backdrop-blur-md
        border border-[var(--color-border)]
        rounded-2xl shadow-[var(--depth-surface)]
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
