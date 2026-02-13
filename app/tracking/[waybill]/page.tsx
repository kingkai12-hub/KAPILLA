'use client';

import { useParams, useRouter } from 'next/navigation';
import SimpleMap from '@/components/SimpleMap';

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const waybill = params.waybill as string;

  // Validate waybill format
  if (!waybill || !waybill.match(/^KPL-\d+$/i)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Waybill Number</h1>
          <p className="text-gray-600 mb-4">The waybill number "{waybill}" is not valid.</p>
          <p className="text-gray-500 text-sm mb-6">Expected format: KPL-123456</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Tracking</h1>
                <p className="text-sm text-gray-500">Waybill: {waybill}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Live Tracking
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <SimpleMap waybillNumber={waybill} className="w-full h-full" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            🔄 Refresh Position
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
              alert('Tracking link copied to clipboard!');
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium"
          >
            📋 Copy Link
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
