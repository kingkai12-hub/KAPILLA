"use client";

import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
      Loading Map...
    </div>
  ),
});

const AnimatedVehicleMap = dynamic(() => import('./AnimatedVehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">
      Loading Map...
    </div>
  ),
});

interface Location {
  lat: number;
  lng: number;
  label?: string;
  timestamp?: string;
}

interface MapComponentProps {
  currentLocation?: Location;
  routePath?: [number, number][];
  remainingPath?: [number, number][];
  startPoint?: Location;
  endPoint?: Location;
  center?: [number, number];
  zoom?: number;
  checkIns?: Location[];
}

export default function Map({ 
  currentLocation, 
  routePath, 
  remainingPath, 
  startPoint, 
  endPoint, 
  center, 
  zoom, 
  checkIns 
}: MapComponentProps) {
  // Use animated map when there's current location and route
  if (currentLocation && routePath && routePath.length > 0) {
    return (
      <AnimatedVehicleMap 
        center={center}
        zoom={zoom}
        currentLocation={currentLocation}
        routePath={routePath}
        remainingPath={remainingPath}
        startPoint={startPoint}
        endPoint={endPoint}
        checkIns={checkIns}
      />
    );
  }
  
  // Use static map for other cases
  return <LeafletMap />;
}
