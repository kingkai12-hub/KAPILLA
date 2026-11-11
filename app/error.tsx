'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center safe-page">
      <div className="w-full max-w-xl glass-card p-8 sm:p-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm text-charcoal-light leading-relaxed">
          An unexpected error occurred. Please try again.
        </p>
        {error?.digest && <p className="mt-3 text-xs text-charcoal-muted">Ref: {error.digest}</p>}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-navy-900 hover:bg-accent-dark transition-colors"
          >
            Try again
          </button>
          <a
            href="/api/health"
            className="inline-flex items-center justify-center rounded-md border border-navy-200 bg-white px-6 py-3 font-semibold text-navy-800 hover:bg-navy-50 transition-colors"
          >
            System health
          </a>
        </div>
      </div>
    </div>
  );
}
