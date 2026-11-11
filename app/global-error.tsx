'use client';

import { useEffect } from 'react';

/**
 * Replaces the root layout when an unrecoverable error occurs, so global
 * stylesheets are NOT loaded here — everything is inlined with the brand
 * palette so the page still renders correctly on its own.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#f4f7fb',
          color: '#2b333b',
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0b1f3a', margin: 0 }}>
              System error
            </h1>
            <p style={{ marginTop: '1rem', color: '#4a545e', lineHeight: 1.6 }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '2rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: '#ffc72c',
                color: '#0b1f3a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
