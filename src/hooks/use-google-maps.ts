import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID, hasGoogleMaps } from '@/lib/google-maps';

export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'es',
    region: 'AR',
  });
}

export { hasGoogleMaps };
