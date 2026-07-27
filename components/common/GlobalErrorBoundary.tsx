'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary for catching React errors
 * Prevents entire app from crashing
 */
export function GlobalErrorBoundary({ children }: ErrorBoundaryProps) {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
  });

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      setState({ hasError: true, error: error.error });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (state.hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We&apos;ve encountered an unexpected error. Please try refreshing the page.
          </p>
          
          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 mb-6 text-left">
              <p className="text-sm text-red-600 dark:text-red-400 font-mono">
                {state.error.message}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => setState({ hasError: false, error: null })}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
