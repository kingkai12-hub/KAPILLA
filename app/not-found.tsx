import Link from 'next/link';
import { Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <div className="bg-white p-4 rounded-full shadow-lg inline-flex mb-6">
          <Package className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Page Not Found</h2>
        <p className="text-slate-600 mb-8 max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
