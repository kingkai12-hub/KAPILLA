import { VehicleTrackingMap } from '@/components/VehicleTrackingMap';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface TrackingPageProps {
  params: {
    waybill: string;
  };
}

export async function generateMetadata({ params }: TrackingPageProps): Promise<Metadata> {
  return {
    title: `Track ${params.waybill} - Kapilla Logistics`,
    description: `Track shipment ${params.waybill} in real-time with our advanced vehicle tracking system`,
  };
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { waybill } = params;

  // Validate waybill format (basic validation)
  if (!waybill || !waybill.match(/^KPL-\d+$/)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
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
          <VehicleTrackingMap waybillNumber={waybill} className="w-full h-full" />
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
          <a
            href={`/tracking/map`}
            className="block w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium text-center"
          >
            🗺️ Track Another
          </a>
        </div>
      </div>
    </div>
  );
}
