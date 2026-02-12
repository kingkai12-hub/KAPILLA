import { VehicleTrackingMap } from '@/components/VehicleTrackingMap';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Vehicle Tracking - Kapilla Logistics',
  description: 'Track your shipment in real-time with our advanced vehicle tracking system',
};

export default function TrackingMapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Live Vehicle Tracking</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Real-time tracking powered by Kapilla Logistics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Enter your waybill number below to track your shipment in real-time.</strong>
                  The map will show the vehicle's current position, completed route (blue), and remaining route (red).
                </p>
              </div>
            </div>
          </div>

          {/* Waybill Input */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-4">
              <label htmlFor="waybill" className="block text-sm font-medium text-gray-700">
                Waybill Number:
              </label>
              <input
                type="text"
                id="waybill"
                placeholder="e.g., KPL-26020002"
                className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const waybill = (e.target as HTMLInputElement).value.trim();
                    if (waybill) {
                      window.location.href = `/tracking/map/${waybill}`;
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('waybill') as HTMLInputElement;
                  const waybill = input?.value.trim();
                  if (waybill) {
                    window.location.href = `/tracking/map/${waybill}`;
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Track
              </button>
            </div>
          </div>

          {/* Sample Tracking Links */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Shipments for Testing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900">Dar es Salaam → Mbeya</h4>
                <p className="text-sm text-gray-600 mb-2">Long distance route</p>
                <a
                  href="/tracking/map/KPL-26020002"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Track KPL-26020002 →
                </a>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900">Dar es Salaam → Mwanza</h4>
                <p className="text-sm text-gray-600 mb-2">Northern route</p>
                <a
                  href="/tracking/map/KPL-26020003"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Track KPL-26020003 →
                </a>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900">Dar es Salaam → Arusha</h4>
                <p className="text-sm text-gray-600 mb-2">Tourist route</p>
                <a
                  href="/tracking/map/KPL-26020004"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Track KPL-26020004 →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📍</span>
                </div>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Real-time Tracking</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Track your shipment in real-time with updates every 2 seconds. Watch as the vehicle moves along its route.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🚚</span>
                </div>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Smart Speed Logic</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Vehicle speed automatically adjusts based on location - slower in cities (20-50 km/h) and faster on highways.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Progress Visualization</h3>
            </div>
            <p className="text-gray-600 text-sm">
              See completed path in blue and remaining route in red. Monitor progress percentage and current speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
