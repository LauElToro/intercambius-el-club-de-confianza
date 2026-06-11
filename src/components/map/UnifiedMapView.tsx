import { hasGoogleMaps } from '@/lib/google-maps';
import { useGoogleMapsLoader } from '@/hooks/use-google-maps';
import { MapView as LeafletMapView, type MapViewProps } from './MapView';
import { GoogleMapView } from './GoogleMapView';
import { Loader2 } from 'lucide-react';

/** Mapa unificado: Google Maps si hay API key, sino Leaflet/OSM. */
export function UnifiedMapView(props: MapViewProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();

  if (!hasGoogleMaps) {
    return <LeafletMapView {...props} />;
  }

  if (loadError) {
    return (
      <div
        className="rounded-lg border border-destructive/40 bg-destructive/5 flex items-center justify-center text-sm text-destructive p-4"
        style={{ height: props.height ?? 240 }}
      >
        No se pudo cargar Google Maps. Revisá VITE_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="rounded-lg border border-border bg-muted/30 flex items-center justify-center"
        style={{ height: props.height ?? 240 }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <GoogleMapView {...props} />;
}

export type { MapViewProps, MapMarker } from './GoogleMapView';
