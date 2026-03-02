/**
 * Generic React Error Boundary that catches render-time exceptions.
 * Displays a fallback UI instead of crashing the entire tree.
 * Separate boundaries per feature (player/catalog/detail) ensure
 * a crash in one area doesn't unmount another.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

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
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center text-white/70">
        <p className="text-lg font-semibold text-white/90">
          {this.props.area ? `Erreur dans ${this.props.area}` : 'Une erreur est survenue'}
        </p>
        <p className="max-w-md text-sm">{error.message}</p>
        <button
          onClick={this.handleReset}
          className="cursor-pointer rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          Reessayer
        </button>
      </div>
    );
  }
}
