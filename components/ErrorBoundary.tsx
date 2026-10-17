'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const digest = (error as Error & { digest?: string })?.digest;
    console.error('Uncaught error:', error, errorInfo, digest ? `digest=${digest}` : '');
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const digest = (this.state.error as Error & { digest?: string })?.digest;

      return (
        <div className="w-full h-full min-h-[200px] bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Something went wrong
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mb-4">
            We couldn't load this component. Please try refreshing the page.
          </p>
          {digest && (
            <p className="text-[10px] font-mono text-slate-400 max-w-xs mb-4 break-all">
              Reference: {digest}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
