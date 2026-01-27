'use client';

import { useEffect } from 'react';

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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
          <div className="text-center">
             <h1 className="text-4xl font-bold text-slate-900 mb-4">System Error</h1>
             <p className="text-slate-500 mb-8">A critical error occurred. Please refresh.</p>
             <button 
               onClick={() => window.location.reload()}
               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
             >
               Refresh
             </button>
          </div>
        </div>
      </body>
    </html>
  );
}
