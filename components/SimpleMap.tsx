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

        {/* Simple Route Visualization */}
        {trackingData?.route && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Simple dots for route points */}
            {trackingData.route.map((point: any, index: number) => {
              const x = 10 + (index * 15);
              const y = 50;
              return (
                <circle
                  key={`route-${index}`}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={index === 0 ? "#10b981" : "#3b82f6"}
                />
              );
            })}
            
            {/* Current Position */}
            {trackingData.currentPosition && (
              <circle
                cx="20"
                cy="50"
                r="4"
                fill="#10b981"
                stroke="white"
                strokeWidth="1"
              />
            )}
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
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Vehicle Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Route Points</span>
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
