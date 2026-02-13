'use client';

import { useState, useEffect } from 'react';

interface SimpleMapProps {
  waybillNumber: string;
  className?: string;
}

export default function SimpleMap({ waybillNumber, className = '' }: SimpleMapProps) {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        console.log('Fetching tracking data for:', waybillNumber);
        const response = await fetch(`/api/vehicle-tracking?waybill=${waybillNumber}`);
        
        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Tracking data received:', data);
        setTrackingData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tracking data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [waybillNumber]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-red-800">Failed to load tracking data</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Simple Map Placeholder */}
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Route Visualization */}
        {trackingData?.route && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Calculate bounds for proper scaling */}
            {(() => {
              try {
                const allPoints = [...(trackingData.completedPath || []), ...(trackingData.remainingPath || [])];
                if (allPoints.length === 0) return null;
                
                const lats = allPoints.map(p => p[0]);
                const lngs = allPoints.map(p => p[1]);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                
                const latRange = maxLat - minLat || 1;
                const lngRange = maxLng - minLng || 1;
                
                return (
                  <>
                    {/* Completed Path */}
                    {trackingData.completedPath?.map((point: any, index: number) => (
                      <circle
                        key={`completed-${index}`}
                        cx={((point[1] - minLng) / lngRange) * 80 + 10}
                        cy={((point[0] - minLat) / latRange) * 80 + 10}
                        r="1.5"
                        fill="#3b82f6"
                      />
                    ))}
                    
                    {/* Remaining Path */}
                    {trackingData.remainingPath?.map((point: any, index: number) => (
                      <circle
                        key={`remaining-${index}`}
                        cx={((point[1] - minLng) / lngRange) * 80 + 10}
                        cy={((point[0] - minLat) / latRange) * 80 + 10}
                        r="1.5"
                        fill="#ef4444"
                      />
                    ))}
                    
                    {/* Current Position */}
                    {trackingData.currentPosition && (
                      <circle
                        cx={((trackingData.currentPosition.lng - minLng) / lngRange) * 80 + 10}
                        cy={((trackingData.currentPosition.lat - minLat) / latRange) * 80 + 10}
                        r="4"
                        fill="#10b981"
                        stroke="white"
                        strokeWidth="1"
                      />
                    )}
                  </>
                );
              } catch (error) {
                console.error('Error rendering route visualization:', error);
                return (
                  <text x="50" y="50" textAnchor="middle" fill="#666" fontSize="4">
                    Map visualization error
                  </text>
                );
              }
            })()}
          </svg>
        )}

        {/* Tracking Info Panel */}
        {trackingData && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs">
            <h3 className="font-bold text-gray-800 mb-2">{trackingData.waybillNumber}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Progress:</span>
                <span className="font-medium">{trackingData.progress?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Speed:</span>
                <span className="font-medium">{trackingData.speed?.toFixed(1)} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${trackingData.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {trackingData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${trackingData.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Completed Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Remaining Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-xs text-gray-600">Vehicle Position</span>
            </div>
          </div>
        </div>

        {/* Center Title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-700">Live Tracking Map</h3>
            <p className="text-sm text-gray-500">Simple Map Visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
