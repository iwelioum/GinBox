/**
 * Generic React Error Boundary that catches render-time exceptions.
 * Displays a fallback UI instead of crashing the entire tree.
 * Separate boundaries per feature (player/catalog/detail) ensure
 * a crash in one area doesn't unmount another.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/shared/i18n';

interface ErrorBoundaryProps {
  /** Label shown in the fallback UI to identify which area crashed */
  area?: string;
  /** Optional custom fallback renderer */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Isolates render crashes per feature area so a player error doesn't unmount the catalog or vice versa. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.area ? `:${this.props.area}` : ''}]`, error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.handleReset);
    }

    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center text-[var(--color-text-secondary)]">
        <div className="text-[var(--color-text-muted)]">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">
          {this.props.area ? `Error in ${this.props.area}` : 'An error occurred'}
        </p>
        <p className="max-w-md text-sm text-[var(--color-text-secondary)]">{error.message}</p>
        <button
          onClick={this.handleReset}
          className="cursor-pointer rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-overlay)] transition-colors"
        >
          {i18n.t('common.retry')}
        </button>
      </div>
    );
  }
}
