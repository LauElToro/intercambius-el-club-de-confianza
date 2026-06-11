export const DEFAULT_MAP_CENTER = { lat: -34.6037, lng: -58.3816 };

/** Distancia en km (Haversine) — misma fórmula que el backend. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function roundDistanceKm(km: number): number {
  return Math.round(km * 10) / 10;
}

export function formatDistanciaKm(km: number | undefined | null): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  return `${roundDistanceKm(km)} km`;
}

export function zoomForRadiusKm(radiusKm: number): number {
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 11;
  if (radiusKm <= 50) return 10;
  return 9;
}

export function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    !Number.isNaN(lat) &&
    typeof lng === 'number' &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
