/**
 * Desacoplado de `api` y `authService` para poder reaccionar a 401 / token inválido
 * sin dependencias circulares.
 */

type SessionInvalidHandler = () => void;

let handler: SessionInvalidHandler | null = null;
let notifyLock = false;

export function setAuthSessionInvalidHandler(fn: SessionInvalidHandler | null): void {
  handler = fn;
}

/** Rutas de auth donde un 401 no implica “cerrar sesión del usuario” (p. ej. credenciales incorrectas). */
export function isPublicAuthEndpoint(endpoint: string): boolean {
  const path = endpoint.split('?')[0] ?? endpoint;
  const prefixes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/verify-mfa',
    '/api/auth/resend-mfa',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
  ];
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export function shouldInvalidateUserSession(status: number, message: string): boolean {
  const m = (message || '').trim().toLowerCase();
  if (status === 401) return true;
  if (!m) return false;
  if (/token/.test(m) && /(inv[aá]lid|invalido|invalid|expirad|expired|mal\s*formad|no\s*v[aá]lid)/i.test(m)) {
    return true;
  }
  if (/jwt/.test(m) && /(inv[aá]lid|invalido|invalid|expirad|expired)/i.test(m)) return true;
  if (/sesi[oó]n/.test(m) && /expirad/i.test(m)) return true;
  return false;
}

export function notifyAuthSessionInvalid(): void {
  if (!handler || notifyLock) return;
  notifyLock = true;
  queueMicrotask(() => {
    try {
      handler?.();
    } finally {
      notifyLock = false;
    }
  });
}
