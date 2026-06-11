import { useCallback, useMemo } from 'react';
import { Circle, GoogleMap, Marker } from '@react-google-maps/api';
import { DEFAULT_MAP_CENTER, zoomForRadiusKm } from '@/lib/geo';

export interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

export interface GoogleMapViewProps {
  center: { lat: number; lng: number };
  radiusKm?: number;
  className?: string;
  height?: number;
  markers?: MapMarker[];
  /** Marcador principal draggable (selector de ubicación) */
  draggableCenter?: boolean;
  onCenterChange?: (lat: number, lng: number) => void;
  zoom?: number;
}

const mapContainerStyle = (height: number) => ({
  width: '100%',
  height: `${height}px`,
});

export function GoogleMapView({
  center,
  radiusKm = 25,
  className = '',
  height = 240,
  markers = [],
  draggableCenter = false,
  onCenterChange,
  zoom,
}: GoogleMapViewProps) {
  const mapZoom = zoom ?? zoomForRadiusKm(radiusKm);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    }),
    [],
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!onCenterChange || !e.latLng) return;
      onCenterChange(e.latLng.lat(), e.latLng.lng());
    },
    [onCenterChange],
  );

  const handleMarkerDrag = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!onCenterChange || !e.latLng) return;
      onCenterChange(e.latLng.lat(), e.latLng.lng());
    },
    [onCenterChange],
  );

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle(height)}
        center={center}
        zoom={mapZoom}
        options={mapOptions}
        onClick={onCenterChange ? handleMapClick : undefined}
      >
        {radiusKm > 0 && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            options={{
              strokeColor: '#b8860b',
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: '#b8860b',
              fillOpacity: 0.15,
            }}
          />
        )}

        {(draggableCenter || markers.length === 0) && (
          <Marker
            position={center}
            draggable={draggableCenter}
            onDragEnd={draggableCenter ? handleMarkerDrag : undefined}
          />
        )}

        {markers
          .filter((m) => !(draggableCenter && m.lat === center.lat && m.lng === center.lng))
          .map((m, i) => (
            <Marker key={`${m.lat}-${m.lng}-${i}`} position={m} title={m.title} />
          ))}
      </GoogleMap>
    </div>
  );
}

export { DEFAULT_MAP_CENTER };
