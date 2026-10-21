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

/**
 * Guards against reload loops: we only auto-reload for a stale-bundle failure
 * once per tab session. If it still fails after that, the user sees the panel.
 */
const CHUNK_RELOAD_KEY = 'kapilla_chunk_reload';

/**
 * A stale cached document (or a service worker serving an old page) references
 * JS chunk hashes that no longer exist after a deploy. Next.js surfaces that as
 * one of these messages. Re-rendering the same tree cannot fix it — only a fresh
 * document can — so these are treated specially.
 */
function isStaleBundleError(error?: Error): boolean {
  if (!error) return false;
  const message = `${error.name} ${error.message}`.toLowerCase();
  return (
    message.includes('chunkloaderror') ||
    message.includes('loading chunk') ||
    message.includes('loading css chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('importing a module script failed')
  );
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const digest = (error as Error & { digest?: string })?.digest;
    console.error('Uncaught error:', error, errorInfo, digest ? `digest=${digest}` : '');

    if (isStaleBundleError(error)) {
      this.reloadOnce();
    }
  }

  /** Reload the document, but at most once per session so we can't loop. */
  private reloadOnce() {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    } catch {
      // sessionStorage unavailable (private mode / blocked) — still reload once.
    }
    window.location.reload();
  }

  private handleRetry = () => {
    if (typeof window !== 'undefined') {
      // Clear the guard so a later stale-bundle failure can self-heal again,
      // then fetch a fresh document instead of re-rendering the broken tree.
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        // ignore
      }
      window.location.reload();
      return;
    }
    this.setState({ hasError: false });
  };

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
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Something went wrong</h3>
          <p className="text-xs text-slate-500 max-w-xs mb-4">
            We couldn&apos;t load this component. Please try refreshing the page.
          </p>
          {digest && (
            <p className="text-[10px] font-mono text-slate-400 max-w-xs mb-4 break-all">
              Reference: {digest}
            </p>
          )}
          <button
            onClick={this.handleRetry}
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
