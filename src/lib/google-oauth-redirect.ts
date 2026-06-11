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
}

const STORAGE_KEY = 'intercambius_google_auth_pending';

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
export function startGoogleOAuthRedirect(pending: GoogleAuthPending): void {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Sign-In no configurado');
  }

  saveGoogleAuthPending(pending);

  const redirectUri = getGoogleAuthRedirectUri();
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
