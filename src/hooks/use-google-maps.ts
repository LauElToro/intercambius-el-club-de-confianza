import { useJsApiLoader } from '@react-google-maps/api';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID,
  hasGoogleMapsKey,
  shouldUseGoogleMaps,
} from '@/lib/google-maps';

export function useGoogleMapsLoader() {
  const enabled = shouldUseGoogleMaps();

  return useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: enabled ? GOOGLE_MAPS_API_KEY : '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'es',
    region: 'AR',
  });
}

export { hasGoogleMapsKey as hasGoogleMaps, shouldUseGoogleMaps };
