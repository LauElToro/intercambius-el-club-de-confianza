import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
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
  onLoad?: () => void;
  /** Si el mapa no responde a tiempo (API desactivada, key inválida, etc.) */
  onLoadTimeout?: () => void;
  loadTimeoutMs?: number;
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
  onLoad,
  onLoadTimeout,
  loadTimeoutMs = 2500,
}: GoogleMapViewProps) {
  const mapZoom = zoom ?? zoomForRadiusKm(radiusKm);
  const [mapReady, setMapReady] = useState(false);
  const loadReportedRef = useRef(false);
  const timeoutReportedRef = useRef(false);

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

  const handleMapLoad = useCallback(() => {
    if (loadReportedRef.current) return;
    loadReportedRef.current = true;
    setMapReady(true);
    onLoad?.();
  }, [onLoad]);

  useEffect(() => {
    loadReportedRef.current = false;
    timeoutReportedRef.current = false;
    setMapReady(false);

    const timer = window.setTimeout(() => {
      if (!loadReportedRef.current && !timeoutReportedRef.current) {
        timeoutReportedRef.current = true;
        onLoadTimeout?.();
      }
    }, loadTimeoutMs);

    return () => window.clearTimeout(timer);
  }, [center.lat, center.lng, loadTimeoutMs, onLoadTimeout]);

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
    <div
      className={`relative rounded-lg overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className={mapReady ? 'opacity-100' : 'opacity-0'}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle(height)}
          center={center}
          zoom={mapZoom}
          options={mapOptions}
          onClick={onCenterChange ? handleMapClick : undefined}
          onLoad={handleMapLoad}
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
    </div>
  );
}

export { DEFAULT_MAP_CENTER };
