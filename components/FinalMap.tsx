'use client';

import { useState } from 'react';

interface FinalMapProps {
  waybillNumber: string;
  className?: string;
}

export default function FinalMap({ waybillNumber, className = '' }: FinalMapProps) {
  const [clicked, setClicked] = useState(false);

  // Simulated tracking data for immediate display
  const mockData = {
    waybillNumber,
    progress: 65,
    speed: 42,
    isActive: true,
    routeLength: 5,
    lastUpdate: new Date().toISOString()
  };

  const handleRefresh = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 1000);
  };

  return (
    <div className={`relative bg-gradient-to-br from-emerald-50 to-blue-50 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🗺️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Vehicle Tracking</h1>
            <p className="text-lg text-gray-600 mb-6">Waybill: {mockData.waybillNumber}</p>
          </div>
          
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="text-blue-600 font-semibold mb-2 text-sm">PROGRESS</div>
                <div className="text-3xl font-bold text-blue-700">{mockData.progress}%</div>
                <div className="w-full bg-blue-200 rounded-full h-3 mt-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${mockData.progress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-500 mt-2">Route Completion</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="text-green-600 font-semibold mb-2 text-sm">SPEED</div>
                <div className="text-3xl font-bold text-green-700">{mockData.speed} km/h</div>
                <div className="text-xs text-green-500 mt-2">Current Velocity</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="text-purple-600 font-semibold mb-2 text-sm">STATUS</div>
                <div className="text-2xl font-bold text-purple-700">
                  {mockData.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
                </div>
                <div className="text-xs text-purple-500 mt-2">
                  {mockData.isActive ? 'Vehicle in Transit' : 'Vehicle Stopped'}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleRefresh}
                className={`px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-lg shadow-lg ${
                  clicked ? 'scale-95 opacity-80' : 'scale-100 hover:scale-105'
                }`}
              >
                🔄 Refresh Position
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('✅ Tracking link copied to clipboard!');
                }}
                className="px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold text-lg shadow-lg hover:scale-105"
              >
                📋 Copy Tracking Link
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold text-lg shadow-lg hover:scale-105"
              >
                🔄 Reload Full Page
              </button>
            </div>
            
            {/* Additional Info */}
            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-gray-600 font-medium mb-2">📍 ROUTE INFORMATION</div>
                <div className="text-sm text-gray-500">
                  <div>Route Points: {mockData.routeLength}</div>
                  <div>Last Update: {new Date(mockData.lastUpdate).toLocaleString()}</div>
                  <div>Tracking ID: {mockData.waybillNumber}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
