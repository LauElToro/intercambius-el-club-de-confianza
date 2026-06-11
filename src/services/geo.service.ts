import api from '@/lib/api';

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

export interface PlaceSuggestion {
  placeId: string;
  label: string;
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

  async autocomplete(input: string): Promise<PlaceSuggestion[]> {
    try {
      const q = encodeURIComponent(input.trim());
      return await api.get<PlaceSuggestion[]>(`/api/geo/autocomplete?input=${q}`);
    } catch {
      return [];
    }
  },

  async getPlace(placeId: string): Promise<GeocodeResult | null> {
    try {
      const id = encodeURIComponent(placeId.trim());
      return await api.get<GeocodeResult>(`/api/geo/place?placeId=${id}`);
    } catch {
      return null;
    }
  },
};
