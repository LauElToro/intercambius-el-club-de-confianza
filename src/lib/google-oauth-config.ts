export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';

export const isGoogleSignInEnabled = GOOGLE_CLIENT_ID.length > 0;
