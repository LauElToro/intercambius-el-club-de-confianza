import type { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? '';

export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'geometry'];

export const GOOGLE_MAPS_LOADER_ID = 'intercambius-google-maps';

const SESSION_DISABLE_KEY = 'intercambius_gmaps_unavailable';

/** Hay API key configurada (build time). */
export const hasGoogleMapsKey = GOOGLE_MAPS_API_KEY.length > 0;

export function isGoogleMapsDisabledInSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISABLE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markGoogleMapsUnavailable(): void {
  try {
    sessionStorage.setItem(SESSION_DISABLE_KEY, '1');
  } catch {
    // ignored
  }
}

/** Si conviene intentar Google Maps en esta sesión (key + no deshabilitado). */
export function shouldUseGoogleMaps(): boolean {
  if (!hasGoogleMapsKey) return false;
  if (import.meta.env.VITE_USE_GOOGLE_MAPS === 'false') return false;
  if (isGoogleMapsDisabledInSession()) return false;
  return true;
}

/** @deprecated Usar shouldUseGoogleMaps() */
export const hasGoogleMaps = hasGoogleMapsKey;
