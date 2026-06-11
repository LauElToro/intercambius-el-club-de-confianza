import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_MAP_CENTER, zoomForRadiusKm } from '@/lib/geo';
import type { MapMarker } from './GoogleMapView';

// Fix iconos por defecto en bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapViewProps {
  center: { lat: number; lng: number };
  radiusKm?: number;
  className?: string;
  height?: number;
  markers?: MapMarker[];
  draggableCenter?: boolean;
  onCenterChange?: (lat: number, lng: number) => void;
  zoom?: number;
}

export const MapView = ({
  center,
  radiusKm = 25,
  className = '',
  height = 240,
  markers = [],
  draggableCenter = false,
  onCenterChange,
  zoom,
}: MapViewProps) => {
  const mapZoom = zoom ?? zoomForRadiusKm(radiusKm);

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radiusKm > 0 && (
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#b8860b',
              fillColor: '#b8860b',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        )}
        <DraggableCenterMarker
          center={center}
          draggable={draggableCenter}
          onCenterChange={onCenterChange}
        />
        {markers.map((m, i) => (
          <Marker key={`${m.lat}-${m.lng}-${i}`} position={[m.lat, m.lng]} title={m.title} />
        ))}
        <MapCenterUpdater center={center} />
      </MapContainer>
    </div>
  );
};

function DraggableCenterMarker({
  center,
  draggable,
  onCenterChange,
}: {
  center: { lat: number; lng: number };
  draggable: boolean;
  onCenterChange?: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    markerRef.current?.setLatLng([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  return (
    <Marker
      ref={markerRef}
      position={[center.lat, center.lng]}
      draggable={draggable}
      eventHandlers={
        draggable && onCenterChange
          ? {
              dragend: () => {
                const pos = markerRef.current?.getLatLng();
                if (pos) onCenterChange(pos.lat, pos.lng);
              },
            }
          : undefined
      }
    />
  );
}

function MapCenterUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
}

export { DEFAULT_MAP_CENTER };
