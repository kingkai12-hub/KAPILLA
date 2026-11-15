'use client';

import { MapContainer, CircleMarker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
}

/** Captures map clicks and reports the clicked coordinates. */
function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Lets staff drop a pin on the map for a place that geocoding could not find
 * (e.g. a small village missing from the location dropdown).
 */
export default function LocationPinPicker({ value, onChange }: Props) {
  const center: [number, number] = value ? [value.lat, value.lng] : [-6.369, 34.888];

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <MapContainer
        center={center}
        zoom={value ? 12 : 6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={(lat, lng) => onChange({ lat, lng })} />
        {value && (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={9}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
