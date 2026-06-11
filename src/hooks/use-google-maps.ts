import { useJsApiLoader } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID,
  hasGoogleMapsKey,
  shouldUseGoogleMaps,
} from '@/lib/google-maps';

export function useGoogleMapsLoader() {
  // Opciones del loader siempre estables: @react-google-maps/api falla si cambia apiKey
  // (p. ej. tras markGoogleMapsUnavailable() en timeout o ApiNotActivatedMapError).
  return useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'es',
    region: 'AR',
  });
}

export { hasGoogleMapsKey as hasGoogleMaps, shouldUseGoogleMaps };
