"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Next.js/React-Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Custom truck icon
const truckIconUrl = 'https://cdn-icons-png.flaticon.com/512/759/759739.png';

interface Location {
  lat: number;
  lng: number;
  label?: string;
  timestamp?: string;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  startPoint?: Location;
  endPoint?: Location;
  currentLocation?: Location;
  routePath?: [number, number][]; // Traveled path (Origin -> Current)
  remainingPath?: [number, number][]; // Remaining path (Current -> Dest)
  checkIns?: Location[];
}

function MapUpdater({ center, zoom, routePath, remainingPath }: { center: [number, number]; zoom: number; routePath?: [number, number][]; remainingPath?: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
      // Filter out invalid points
      const validRoutePath = (routePath || []).filter(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1]));
      const validRemainingPath = (remainingPath || []).filter(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && !isNaN(p[0]) && typeof p[1] === 'number' && !isNaN(p[1]));
      
      const allPoints = [...validRoutePath, ...validRemainingPath];
      
      if (allPoints.length > 1) {
        try {
          const bounds = L.latLngBounds(allPoints);
          if (bounds.isValid()) {
             map.fitBounds(bounds, { padding: [50, 50] });
          }
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      } else {
        map.setView(center, zoom);
      }
    }, [center, zoom, map, routePath, remainingPath]);
    return null;
  }

export default function LeafletMap({ 
  center = [-6.3690, 34.8888], // Tanzania Center
  zoom = 6,
  startPoint,
  endPoint,
  currentLocation,
  routePath = [],
  remainingPath = [],
  checkIns = []
}: MapProps) {
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Fix icons on client side
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  const [routeSegments, setRouteSegments] = useState<{
    traveled: [number, number][];
    remaining: [number, number][];
  }>({ traveled: [], remaining: [] });

  useEffect(() => {
    if (!startPoint || !endPoint) return;

    const fetchRoute = async () => {
      try {
        let url = '';
        if (currentLocation) {
            // Fetch route with intermediate waypoint: Start -> Current -> End
            url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${currentLocation.lng},${currentLocation.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson`;
        } else {
            // Fetch direct route: Start -> End
            url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
          
          if (currentLocation) {
             // If we used a waypoint, the route is guaranteed to pass through/near current location.
             // We can find the closest point (which should be very close) to split.
             // Or, simpler: we know the route has 2 legs (Start->Current, Current->End) but OSRM geojson is usually merged.
             // Let's stick to the distance split, which is robust for the returned geometry.
             let minDist = Infinity;
             let splitIndex = 0;
             
             coordinates.forEach((coord: [number, number], index: number) => {
                const dist = Math.pow(coord[0] - currentLocation.lat, 2) + Math.pow(coord[1] - currentLocation.lng, 2);
                if (dist < minDist) {
                    minDist = dist;
                    splitIndex = index;
                }
             });

             setRouteSegments({
                traveled: coordinates.slice(0, splitIndex + 1),
                remaining: coordinates.slice(splitIndex)
             });
          } else {
             setRouteSegments({
                traveled: [],
                remaining: coordinates
             });
          }
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
        // Fallback to straight lines if API fails
        if (currentLocation) {
            setRouteSegments({
                traveled: [[startPoint.lat, startPoint.lng], [currentLocation.lat, currentLocation.lng]],
                remaining: [[currentLocation.lat, currentLocation.lng], [endPoint.lat, endPoint.lng]]
            });
        }
      }
    };

    fetchRoute();
  }, [startPoint, endPoint, currentLocation]);

  // Use internal route segments if available, otherwise fall back to props
  const finalTraveled = routeSegments.traveled.length > 0 ? routeSegments.traveled : routePath;
  const finalRemaining = routeSegments.remaining.length > 0 ? routeSegments.remaining : remainingPath;

  const truckIcon = L.icon({
    iconUrl: truckIconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

  const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  if (!isClient) return null;

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} zoom={zoom} routePath={finalTraveled} remainingPath={finalRemaining} />

      {startPoint && typeof startPoint.lat === 'number' && typeof startPoint.lng === 'number' && (
        <Marker position={[startPoint.lat, startPoint.lng]} icon={defaultIcon}>
          <Popup>Start: {startPoint.label}</Popup>
        </Marker>
      )}

      {endPoint && typeof endPoint.lat === 'number' && typeof endPoint.lng === 'number' && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={defaultIcon}>
          <Popup>Destination: {endPoint.label}</Popup>
        </Marker>
      )}

      {currentLocation && typeof currentLocation.lat === 'number' && typeof currentLocation.lng === 'number' && (
        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={truckIcon}>
          <Popup>
            <div className="text-center">
              <strong className="block text-blue-600">Current Location</strong>
              <span className="text-xs text-gray-500">{currentLocation.timestamp}</span>
              <p className="text-sm">{currentLocation.label}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {checkIns.map((checkIn, idx) => (
        typeof checkIn.lat === 'number' && typeof checkIn.lng === 'number' ? (
        <Marker key={idx} position={[checkIn.lat, checkIn.lng]} icon={defaultIcon} opacity={0.6}>
          <Popup>
            <span className="font-bold">Check-in {idx + 1}</span><br/>
            {checkIn.label}<br/>
            <span className="text-xs">{checkIn.timestamp}</span>
          </Popup>
        </Marker>
        ) : null
      ))}

      {finalTraveled.length > 0 && (
        <Polyline 
          positions={finalTraveled} 
          color="#2563eb" 
          weight={5} 
          opacity={0.8} 
        />
      )}

      {finalRemaining.length > 0 && (
        <Polyline 
          positions={finalRemaining} 
          color="#94a3b8" 
          weight={5} 
          opacity={0.5} 
          dashArray="10, 10"
        />
      )}
    </MapContainer>
  );
}
