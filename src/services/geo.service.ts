import api from '@/lib/api';

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

export const geoService = {
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      const q = encodeURIComponent(address.trim());
      return await api.get<GeocodeResult>(`/api/geo/geocode?address=${q}`);
    } catch {
      return null;
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
    try {
      return await api.get<GeocodeResult>(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
    } catch {
      return null;
    }
  },
};
