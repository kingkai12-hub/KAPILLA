'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// CSS import should be at top level
import 'leaflet/dist/leaflet.css';

interface TrackingData {
  waybillNumber: string;
  route: [number, number][];
  currentPosition: { lat: number; lng: number };
  progress: number;
  completedPath: [number, number][];
  remainingPath: [number, number][];
  speed: number;
  isActive: boolean;
  lastUpdate?: string;
}

interface VehicleTrackingMapProps {
  waybillNumber: string;
  className?: string;
}

function VehicleTrackingMapComponent({ waybillNumber, className = '' }: VehicleTrackingMapProps) {
  // Dynamically import Leaflet to avoid SSR issues
  const L = require('leaflet');
  
  // Fix for default marker icons in Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const completedPathRef = useRef<any>(null);
  const remainingPathRef = useRef<any>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Calculate optimal zoom level based on route
  const calculateOptimalZoom = useCallback((route: [number, number][]) => {
    if (!route || route.length === 0) return 7;

    const bounds = L.latLngBounds(route);
    const map = mapInstanceRef.current;
    
    if (!map || !mapRef.current) return 7;

    // Get map dimensions
    const mapWidth = mapRef.current.clientWidth;
    const mapHeight = mapRef.current.clientHeight;

    // Calculate zoom that fits the route with padding
    const zoom = map.getBoundsZoom(bounds, false, [mapWidth - 100, mapHeight - 100]);
    
    // Ensure zoom is within reasonable bounds for road visibility
    return Math.max(Math.min(zoom, 12), 8);
  }, []);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: [-6.8151812, 39.2864692], // Default to Dar es Salaam
        zoom: 8,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer with better road visibility
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
      }).addTo(map);

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapInitialized(true);
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to initialize map');
    }
  }, []);

  // Create vehicle icon
  const createVehicleIcon = useCallback(() => {
    return L.divIcon({
      html: `
        <div style="
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1000;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">🚚</div>
        </div>
      `,
      className: 'vehicle-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13]
    });
  }, []);

  // Update map with tracking data
  const updateMapWithTrackingData = useCallback((data: TrackingData) => {
    const map = mapInstanceRef.current;
    if (!map || !mapInitialized) return;

    // Clear existing layers
    if (vehicleMarkerRef.current) {
      map.removeLayer(vehicleMarkerRef.current);
    }
    if (completedPathRef.current) {
      map.removeLayer(completedPathRef.current);
    }
    if (remainingPathRef.current) {
      map.removeLayer(remainingPathRef.current);
    }

    // Add completed path (BLUE)
    if (data.completedPath && data.completedPath.length > 0) {
      completedPathRef.current = L.polyline(data.completedPath, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(map);
    }

    // Add remaining path (RED)
    if (data.remainingPath && data.remainingPath.length > 0) {
      remainingPathRef.current = L.polyline(data.remainingPath, {
        color: '#ef4444',
        weight: 6,
        opacity: 0.8,
        smoothFactor: 1,
        dashArray: '10, 5'
      }).addTo(map);
    }

    // Add vehicle marker
    const vehicleIcon = createVehicleIcon();
    vehicleMarkerRef.current = L.marker([data.currentPosition.lat, data.currentPosition.lng], {
      icon: vehicleIcon,
      zIndexOffset: 1000
    }).addTo(map);

    // Add popup to vehicle marker
    vehicleMarkerRef.current.bindPopup(`
      <div style="font-family: Arial, sans-serif; font-size: 12px;">
        <strong>${data.waybillNumber}</strong><br>
        Speed: ${data.speed.toFixed(1)} km/h<br>
        Progress: ${data.progress.toFixed(1)}%<br>
        Status: ${data.isActive ? 'Active' : 'Inactive'}
      </div>
    `);

    // Set map view to optimal zoom on first load
    if (data.route && data.route.length > 0) {
      const bounds = L.latLngBounds(data.route);
      const optimalZoom = calculateOptimalZoom(data.route);
      
      // Only fit bounds if this is the first load or if user hasn't manually zoomed
      if (!trackingData) {
        map.fitBounds(bounds, { padding: [50, 50] });
        if (map.getZoom() > optimalZoom) {
          map.setZoom(optimalZoom);
        }
      }
    }
  }, [mapInitialized, trackingData, calculateOptimalZoom, createVehicleIcon]);

  // Fetch tracking data
  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await fetch(`/api/vehicle-tracking?waybill=${waybillNumber}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTrackingData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [waybillNumber]);

  // Initialize map on component mount
  useEffect(() => {
    initializeMap();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  // Fetch initial data and set up updates
  useEffect(() => {
    if (!mapInitialized) return;

    fetchTrackingData();

    // Set up real-time updates every 2 seconds
    updateIntervalRef.current = setInterval(fetchTrackingData, 2000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [mapInitialized, fetchTrackingData]);

  // Update map when tracking data changes
  useEffect(() => {
    if (trackingData && mapInitialized) {
      updateMapWithTrackingData(trackingData);
    }
  }, [trackingData, mapInitialized, updateMapWithTrackingData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current && trackingData) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [trackingData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking map...</p>
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
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]"
        style={{ minHeight: '500px' }}
      />
      
      {/* Tracking Info Panel */}
      {trackingData && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs">
          <h3 className="font-bold text-gray-800 mb-2">{trackingData.waybillNumber}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Progress:</span>
              <span className="font-medium">{trackingData.progress.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Speed:</span>
              <span className="font-medium">{trackingData.speed.toFixed(1)} km/h</span>
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
                style={{ width: `${trackingData.progress}%` }}
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
            <div className="w-4 h-1 bg-blue-500"></div>
            <span className="text-xs text-gray-600">Completed Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></div>
            <span className="text-xs text-gray-600">Remaining Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            <span className="text-xs text-gray-600">Vehicle Position</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export dynamic component to avoid SSR issues
export const VehicleTrackingMap = dynamic(
  () => Promise.resolve(VehicleTrackingMapComponent),
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
