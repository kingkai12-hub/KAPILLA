import Link from 'next/link';
import { Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center safe-page">
      <div className="w-full max-w-xl glass-card p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <span className="glass inline-flex p-3 rounded-md">
            <Package aria-hidden="true" className="w-8 h-8 text-navy-700" />
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-navy-600">Error 404</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
          Page not found
        </h1>
        <p className="mt-4 text-sm text-charcoal-light leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-accent px-6 py-3 font-semibold text-navy-900 hover:bg-accent-dark transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
