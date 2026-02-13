'use client';

import { useState, useEffect } from 'react';

interface BulletproofMapProps {
  waybillNumber: string;
  className?: string;
}

export default function BulletproofMap({ waybillNumber, className = '' }: BulletproofMapProps) {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const loadTracking = async () => {
      setStatus('loading');
      
      try {
        const res = await fetch(`/api/vehicle-tracking?waybill=${waybillNumber}`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const result = await res.json();
        setData(result);
        setStatus('success');
        
        console.log('✅ SUCCESS: Tracking data loaded', result);
      } catch (error) {
        console.error('❌ ERROR: Failed to load tracking data', error);
        setStatus('error');
      }
    };

    loadTracking();
  }, [waybillNumber]);

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center bg-blue-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-blue-700 font-medium">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-red-50 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-3">⚠️</div>
          <p className="text-red-800 font-bold text-lg mb-2">Tracking Data Error</p>
          <p className="text-red-600 mb-4">Unable to load tracking information</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-br from-green-50 to-blue-50 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Vehicle Tracking</h2>
            <p className="text-gray-600">Waybill: {data?.waybillNumber || waybillNumber}</p>
          </div>
          
          {data && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">Progress</div>
                  <div className="text-2xl font-bold text-blue-700">{data.progress?.toFixed(1)}%</div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${data.progress || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">Speed</div>
                  <div className="text-2xl font-bold text-green-700">{data.speed?.toFixed(1)} km/h</div>
                  <div className="text-xs text-green-500 mt-1">Current velocity</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-sm font-medium mb-1 ${data.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    Status
                  </div>
                  <div className={`text-lg font-bold ${data.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                    {data.isActive ? '🟢 Active' : '⚪ Inactive'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600 font-medium mb-1">Route Points</div>
                  <div className="text-lg font-bold text-gray-700">{data.route?.length || 0}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600 font-medium mb-1">Last Update</div>
                  <div className="text-lg font-bold text-gray-700">
                    {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'Unknown'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🔄 Refresh Data
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Tracking link copied!');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  📋 Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
