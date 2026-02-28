'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary for Map Components
 * 
 * Catches errors in map rendering and provides graceful fallback UI
 * Prevents entire page crash when Leaflet or map components fail
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('[MapErrorBoundary] Caught error:', error);
    console.error('[MapErrorBoundary] Error info:', errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state and attempt to re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="h-[600px] w-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl border-4 border-white shadow-inner">
          <div className="text-center px-6 max-w-md">
            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-red-200">
              {/* Error Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 border-4 border-red-200 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h3 className="text-xl font-black text-red-900 uppercase tracking-tight mb-2">
                Map Loading Error
              </h3>

              {/* Error Message */}
              <p className="text-sm text-red-700 mb-4">
                The tracking map encountered an error and couldn't load properly.
              </p>

              {/* Error Details (in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-left">
                  <p className="text-xs font-mono text-red-800 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-red-700 font-bold rounded-xl border-2 border-red-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-red-600 mt-4">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for functional components
 */
export function withMapErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <MapErrorBoundary fallback={fallback}>
        <Component {...props} />
      </MapErrorBoundary>
    );
  };
}
