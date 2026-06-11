import { GOOGLE_CLIENT_ID } from '@/lib/google-oauth-config';

export const GOOGLE_AUTH_CALLBACK_PATH = '/auth/google/callback';

export function getGoogleAuthRedirectUri(): string {
  return `${window.location.origin}${GOOGLE_AUTH_CALLBACK_PATH}`;
}

export type GoogleAuthPendingMode = 'login' | 'register';

export interface GoogleAuthPendingRegister {
  codigoReferido?: string;
  ubicacion?: string;
  contacto?: string;
}

export interface GoogleAuthPending {
  mode: GoogleAuthPendingMode;
  register?: GoogleAuthPendingRegister;
  returnPath: string;
  redirectUri: string;
}

const STORAGE_KEY = 'intercambius_google_auth_pending';
const CODE_USED_PREFIX = 'intercambius_google_code_used:';

export function markGoogleAuthCodeUsed(code: string): boolean {
  const key = CODE_USED_PREFIX + code;
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, '1');
  return true;
}

export function saveGoogleAuthPending(pending: GoogleAuthPending): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

export function loadGoogleAuthPending(): GoogleAuthPending | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleAuthPending;
  } catch {
    return null;
  }
}

export function clearGoogleAuthPending(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Flujo OAuth redirect (usa redirect URIs, no requiere orígenes JS del iframe GIS). */
export function startGoogleOAuthRedirect(
  pending: Omit<GoogleAuthPending, 'redirectUri'>,
): void {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Sign-In no configurado (falta VITE_GOOGLE_CLIENT_ID)');
  }

  const redirectUri = getGoogleAuthRedirectUri();

  try {
    saveGoogleAuthPending({
      ...pending,
      redirectUri,
    });
  } catch {
    throw new Error('No se pudo guardar la sesión de Google. Revisá que las cookies/storage no estén bloqueados.');
  }

  const state = btoa(JSON.stringify({ m: pending.mode, t: Date.now() }));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
