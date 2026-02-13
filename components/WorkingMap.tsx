'use client';

import { useState, useEffect } from 'react';

interface WorkingMapProps {
  waybillNumber: string;
  className?: string;
}

export default function WorkingMap({ waybillNumber, className = '' }: WorkingMapProps) {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Starting fetch for waybill:', waybillNumber);
        const response = await fetch(`/api/vehicle-tracking?waybill=${waybillNumber}`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response OK:', response.ok);
        
        if (!response.ok) {
          console.error('❌ API response not OK:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Tracking data received:', data);
        setTrackingData(data);
        setError(null);
      } catch (err) {
        console.error('💥 Fetch error details:', err);
        console.error('💥 Error type:', typeof err);
        console.error('💥 Error message:', err instanceof Error ? err.message : String(err));
        setError(err instanceof Error ? err.message : 'Failed to load tracking data');
      } finally {
        console.log('🏁 Fetch completed, setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [waybillNumber]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 ${className}`}>
        <div className="text-center">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Tracking Map</h2>
          <p className="text-gray-600 mb-4">Waybill: {trackingData?.waybillNumber}</p>
          
          {trackingData && (
            <div className="mt-6 space-y-2">
              <div className="text-sm text-gray-600">
                Progress: {trackingData.progress?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                Speed: {trackingData.speed?.toFixed(1)} km/h
              </div>
              <div className="text-sm text-gray-600">
                Status: {trackingData.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${trackingData.progress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
