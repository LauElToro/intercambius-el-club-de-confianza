import { useCallback, useEffect, useState } from 'react';
import { shouldUseGoogleMaps } from '@/lib/google-maps';
import { useGoogleMapsLoader } from '@/hooks/use-google-maps';
import { useGoogleMapsFailure } from '@/hooks/use-google-maps-failure';
import { MapView as LeafletMapView, type MapViewProps } from './MapView';
import { GoogleMapView } from './GoogleMapView';
import { MapRenderErrorBoundary } from './MapRenderErrorBoundary';
import { DeferredMapMount } from './DeferredMapMount';
import { Loader2 } from 'lucide-react';

/** Mapa unificado: Google Maps si hay API key y funciona; sino Leaflet/OSM. */
export function UnifiedMapView(props: MapViewProps) {
  const useGoogle = shouldUseGoogleMaps();
  if (!useGoogle) {
    return (
      <DeferredMapMount height={props.height}>
        <LeafletMapView {...props} />
      </DeferredMapMount>
    );
  }
  return <GoogleMapsBranch {...props} />;
}

function MapLoadingPlaceholder({ height = 240 }: { height?: number }) {
  return (
    <div
      className="rounded-lg border border-border bg-muted/30 flex items-center justify-center"
      style={{ height }}
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function GoogleMapsBranch(props: MapViewProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const { failed, reportFailure } = useGoogleMapsFailure();
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const shouldFallback = Boolean(loadError || failed || loadTimedOut);
  // Fase 1: desmontar Google. Fase 2 (siguiente tick): montar Leaflet.
  // Evita removeChild cuando Google ya mutó el DOM.
  const [leafletReady, setLeafletReady] = useState(false);

  const handleLoadTimeout = useCallback(() => {
    reportFailure();
    setLoadTimedOut(true);
  }, [reportFailure]);

  const handleRenderError = useCallback(() => {
    reportFailure();
  }, [reportFailure]);

  useEffect(() => {
    if (!shouldFallback) {
      setLeafletReady(false);
      return;
    }

    setLeafletReady(false);
    const id = window.setTimeout(() => setLeafletReady(true), 0);
    return () => window.clearTimeout(id);
  }, [shouldFallback]);

  if (shouldFallback) {
    if (!leafletReady) {
      return <MapLoadingPlaceholder height={props.height} />;
    }
    return (
      <DeferredMapMount height={props.height}>
        <LeafletMapView key="leaflet-fallback" {...props} />
      </DeferredMapMount>
    );
  }

  if (!isLoaded) {
    return <MapLoadingPlaceholder height={props.height} />;
  }

  return (
    <MapRenderErrorBoundary
      onError={handleRenderError}
      fallback={
        <DeferredMapMount height={props.height}>
          <LeafletMapView key="leaflet-error-fallback" {...props} />
        </DeferredMapMount>
      }
    >
      <DeferredMapMount height={props.height}>
        <GoogleMapView {...props} onLoadTimeout={handleLoadTimeout} />
      </DeferredMapMount>
    </MapRenderErrorBoundary>
  );
}

export type { MapViewProps } from './MapView';
export type { MapMarker } from './GoogleMapView';
