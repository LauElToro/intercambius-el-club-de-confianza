import type { Libraries } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? '';

export const hasGoogleMaps = GOOGLE_MAPS_API_KEY.length > 0;

export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'geometry'];

export const GOOGLE_MAPS_LOADER_ID = 'intercambius-google-maps';
