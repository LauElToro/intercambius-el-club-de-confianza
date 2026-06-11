import { useState } from 'react';
import { shouldUseGoogleMaps } from '@/lib/google-maps';
import { useGoogleMapsLoader } from '@/hooks/use-google-maps';
import { useGoogleMapsFailure } from '@/hooks/use-google-maps-failure';
import { MapView as LeafletMapView, type MapViewProps } from './MapView';
import { GoogleMapView } from './GoogleMapView';
import { MapRenderErrorBoundary } from './MapRenderErrorBoundary';
import { Loader2 } from 'lucide-react';

/** Mapa unificado: Google Maps si hay API key y funciona; sino Leaflet/OSM. */
export function UnifiedMapView(props: MapViewProps) {
  const useGoogle = shouldUseGoogleMaps();
  if (!useGoogle) {
    return <LeafletMapView {...props} />;
  }
  return <GoogleMapsBranch {...props} />;
}

function GoogleMapsBranch(props: MapViewProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const { failed, reportFailure } = useGoogleMapsFailure();
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  if (loadError || failed || loadTimedOut) {
    return <LeafletMapView {...props} />;
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

  return (
    <MapRenderErrorBoundary fallback={<LeafletMapView {...props} />}>
      <GoogleMapView
        {...props}
        onLoadTimeout={() => {
          reportFailure();
          setLoadTimedOut(true);
        }}
      />
    </MapRenderErrorBoundary>
  );
}

export type { MapViewProps, MapMarker } from './GoogleMapView';
