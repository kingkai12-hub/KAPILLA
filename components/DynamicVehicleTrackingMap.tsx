'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const VehicleTrackingMap = dynamic(
  () => import('@/components/VehicleTrackingMap').then(mod => ({ default: mod.VehicleTrackingMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 w-full h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default VehicleTrackingMap;
