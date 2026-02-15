'use client';

import React, { useMemo } from 'react';
import { TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Fuel, Building2, Plane, Hospital, Flag } from 'lucide-react';
import { landmarks, getLandmarksAlongRoute, type Landmark } from '@/lib/landmarks';

const { BaseLayer, Overlay } = LayersControl;

// Create custom icons for different landmark types
const createLandmarkIcon = (type: Landmark['type'], importance: Landmark['importance']) => {
  const size = importance === 'major' ? 32 : importance === 'medium' ? 24 : 18;
  const colors: Record<Landmark['type'], string> = {
    city: '#3b82f6',
    airport: '#8b5cf6',
    port: '#06b6d4',
    station: '#f59e0b',
    landmark: '#10b981',
    fuel: '#ef4444',
    rest: '#84cc16',
    hospital: '#ec4899',
    checkpoint: '#f97316',
  };

  return L.divIcon({
    html: `<div style="
      background: ${colors[type]};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${size * 0.6}px;
    ">${getLandmarkEmoji(type)}</div>`,
    className: 'landmark-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

function getLandmarkEmoji(type: Landmark['type']): string {
  const emojis: Record<Landmark['type'], string> = {
    city: '🏙️',
    airport: '✈️',
    port: '🚢',
    station: '🚂',
    landmark: '🏛️',
    fuel: '⛽',
    rest: '🏕️',
    hospital: '🏥',
    checkpoint: '🛂',
  };
  return emojis[type] || '📍';
}

interface EnhancedTrackingMapLayersProps {
  routePoints?: [number, number][];
  showLandmarks?: boolean;
}

export function EnhancedTrackingMapLayers({
  routePoints,
  showLandmarks = true,
}: EnhancedTrackingMapLayersProps) {
  // Get landmarks along the route
  const routeLandmarks = useMemo(() => {
    if (!routePoints || routePoints.length === 0) {
      // Show major landmarks if no route
      return landmarks.filter((l) => l.importance === 'major');
    }
    return getLandmarksAlongRoute(routePoints, 50); // 50km radius
  }, [routePoints]);

  return (
    <>
      <LayersControl position="topright">
        {/* Base Layers */}
        <BaseLayer checked name="Street Map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </BaseLayer>

        <BaseLayer name="Detailed Streets">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        </BaseLayer>

        <BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        </BaseLayer>

        <BaseLayer name="Terrain">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
          />
        </BaseLayer>

        {/* Overlay Layers */}
        {showLandmarks && (
          <>
            <Overlay checked name="Cities & Towns">
              <>
                {routeLandmarks
                  .filter((l) => l.type === 'city')
                  .map((landmark) => (
                    <Marker
                      key={landmark.id}
                      position={[landmark.lat, landmark.lng]}
                      icon={createLandmarkIcon(landmark.type, landmark.importance)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {landmark.name}
                          </h3>
                          {landmark.description && (
                            <p className="text-xs text-gray-600 mt-1">{landmark.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {landmark.lat.toFixed(4)}, {landmark.lng.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            </Overlay>

            <Overlay checked name="Airports & Ports">
              <>
                {routeLandmarks
                  .filter((l) => l.type === 'airport' || l.type === 'port')
                  .map((landmark) => (
                    <Marker
                      key={landmark.id}
                      position={[landmark.lat, landmark.lng]}
                      icon={createLandmarkIcon(landmark.type, landmark.importance)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            {landmark.type === 'airport' ? (
                              <Plane className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                            {landmark.name}
                          </h3>
                          {landmark.description && (
                            <p className="text-xs text-gray-600 mt-1">{landmark.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            </Overlay>

            <Overlay name="Fuel Stations">
              <>
                {routeLandmarks
                  .filter((l) => l.type === 'fuel')
                  .map((landmark) => (
                    <Marker
                      key={landmark.id}
                      position={[landmark.lat, landmark.lng]}
                      icon={createLandmarkIcon(landmark.type, landmark.importance)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <Fuel className="w-4 h-4" />
                            {landmark.name}
                          </h3>
                          {landmark.description && (
                            <p className="text-xs text-gray-600 mt-1">{landmark.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            </Overlay>

            <Overlay name="Hospitals">
              <>
                {routeLandmarks
                  .filter((l) => l.type === 'hospital')
                  .map((landmark) => (
                    <Marker
                      key={landmark.id}
                      position={[landmark.lat, landmark.lng]}
                      icon={createLandmarkIcon(landmark.type, landmark.importance)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <Hospital className="w-4 h-4" />
                            {landmark.name}
                          </h3>
                          {landmark.description && (
                            <p className="text-xs text-gray-600 mt-1">{landmark.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            </Overlay>

            <Overlay name="Checkpoints">
              <>
                {routeLandmarks
                  .filter((l) => l.type === 'checkpoint')
                  .map((landmark) => (
                    <Marker
                      key={landmark.id}
                      position={[landmark.lat, landmark.lng]}
                      icon={createLandmarkIcon(landmark.type, landmark.importance)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            {landmark.name}
                          </h3>
                          {landmark.description && (
                            <p className="text-xs text-gray-600 mt-1">{landmark.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            </Overlay>

            <Overlay name="Landmarks">
              <>
                {routeLandmarks
                  .filter((l) => l.type === 'landmark')
                  .map((landmark) => (
                    <Marker
                      key={landmark.id}
                      position={[landmark.lat, landmark.lng]}
                      icon={createLandmarkIcon(landmark.type, landmark.importance)}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {landmark.name}
                          </h3>
                          {landmark.description && (
                            <p className="text-xs text-gray-600 mt-1">{landmark.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </>
            </Overlay>
          </>
        )}
      </LayersControl>
    </>
  );
}
