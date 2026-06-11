const DEFAULT_API_URL = 'https://intercambios-backend.vercel.app';

/**
 * Normaliza VITE_API_URL para que fetch() siempre use una URL absoluta.
 * Sin protocolo, el navegador la trata como path relativo (p. ej. intercambius.com.ar → /intercambius.com.ar/...).
 */
export function resolveApiBaseUrl(raw?: string | null): string {
  let url = (raw ?? '').trim();
  if (!url) return DEFAULT_API_URL;

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, '')}`;
  }

  return url.replace(/\/+$/, '');
}

export function buildApiUrl(endpoint: string, baseUrl?: string): string {
  const base = baseUrl ?? resolveApiBaseUrl(import.meta.env.VITE_API_URL);
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
