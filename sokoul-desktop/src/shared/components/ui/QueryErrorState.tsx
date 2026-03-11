// QueryErrorState.tsx — Reusable error state for failed React Query requests
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export interface QueryErrorStateProps {
  error: Error | null;
  refetch: () => void;
  compact?: boolean;
  className?: string;
}

export function QueryErrorState({ error, refetch, compact = false, className }: QueryErrorStateProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] text-xs fade-slide-up ${className ?? ''}`}>
        <svg className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
        </svg>
        <span className="truncate">{t('error.queryFailed')}</span>
        <button
          onClick={(e) => { e.stopPropagation(); refetch(); }}
          className="ml-auto text-[var(--color-accent)] hover:underline flex-shrink-0"
          aria-label={t('error.retry')}
        >
          {t('error.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 text-center fade-slide-up ${className ?? ''}`}>
      <div className="text-[var(--color-text-muted)]">
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 20.5h.01" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
        {t('error.queryFailed')}
      </h3>
      {error?.message && (
        <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
          {error.message}
        </p>
      )}
      <Button variant="secondary" onClick={refetch}>
        {t('error.retry')}
      </Button>
    </div>
  );
}
