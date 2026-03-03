export const UBICACIONES_COORDENADAS: Record<string, { lat: number; lng: number }> = {
  "CABA": { lat: -34.6037, lng: -58.3816 },
  "CABA - Centro": { lat: -34.6037, lng: -58.3816 },
  "CABA - Palermo": { lat: -34.5885, lng: -58.4204 },
  "CABA - Belgrano": { lat: -34.5631, lng: -58.4584 },
  "CABA - Caballito": { lat: -34.6208, lng: -58.4414 },
  "CABA - San Telmo": { lat: -34.6208, lng: -58.3731 },
  "Caballito": { lat: -34.6208, lng: -58.4414 },
  "Palermo": { lat: -34.5885, lng: -58.4204 },
  "Belgrano": { lat: -34.5631, lng: -58.4584 },
  "La Plata": { lat: -34.9215, lng: -57.9545 },
  "Mar del Plata": { lat: -38.0055, lng: -57.5426 },
  "Córdoba": { lat: -31.4201, lng: -64.1888 },
  "Rosario": { lat: -32.9442, lng: -60.6505 },
};

const UBICACION_ALIASES: Record<string, string> = {
  caballito: "CABA - Caballito",
  "caballito bsas": "CABA - Caballito",
  "caballito buenos aires": "CABA - Caballito",
  bsas: "CABA",
  "buenos aires": "CABA",
  capital: "CABA",
  "capital federal": "CABA",
  mardelpata: "Mar del Plata",
  mardelplata: "Mar del Plata",
  "mar del plata": "Mar del Plata",
};

/** Resuelve una ubicación (texto) a coordenadas usando el mapa conocido. */
export function resolveUbicacionToCoords(
  ubicacion: string | undefined
): { lat: number; lng: number; ubicacion: string } | null {
  if (!ubicacion?.trim()) return null;
  const u = ubicacion.trim();
  const exact = UBICACIONES_COORDENADAS[u];
  if (exact) return { ...exact, ubicacion: u };
  const ubNorm = u.toLowerCase();
  const resolvedKey = UBICACION_ALIASES[ubNorm];
  if (resolvedKey && UBICACIONES_COORDENADAS[resolvedKey]) {
    return { ...UBICACIONES_COORDENADAS[resolvedKey], ubicacion: resolvedKey };
  }
  const match = Object.keys(UBICACIONES_COORDENADAS).find(
    (k) => ubNorm.includes(k.toLowerCase()) || k.toLowerCase().includes(ubNorm.split(/\s+/)[0])
  );
  if (match) return { ...UBICACIONES_COORDENADAS[match], ubicacion: match };
  return null;
}
