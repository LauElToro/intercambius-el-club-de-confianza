import { useState } from 'react';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';
import {
  startGoogleOAuthRedirect,
  type GoogleAuthPendingRegister,
  type GoogleAuthPendingMode,
} from '@/lib/google-oauth-redirect';

interface GoogleSignInButtonProps {
  mode: GoogleAuthPendingMode;
  register?: GoogleAuthPendingRegister;
  onError?: (message: string) => void;
  disabled?: boolean;
  disabledHint?: string;
  align?: 'start' | 'center';
}

export function GoogleSignInButton({
  mode,
  register,
  onError,
  disabled,
  disabledHint,
  align = 'start',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInEnabled) {
    return null;
  }

  const handleClick = () => {
    if (disabled || loading) return;
    setLoading(true);
    onError?.('');
    try {
      startGoogleOAuthRedirect({
        mode,
        register,
        returnPath: window.location.pathname,
      });
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google';
      console.error('[GoogleSignIn]', message, err);
      onError?.(message);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`w-full max-w-full ${align === 'start' ? 'flex justify-start' : 'flex justify-center'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || loading}
          aria-label="Continuar con Google"
          className="inline-flex h-10 min-w-[200px] max-w-full items-center justify-center gap-3 rounded border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] shadow-sm transition hover:bg-[#f8f9fa] disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {loading ? 'Redirigiendo...' : 'Continuar con Google'}
        </button>
      </div>
      {disabledHint && (
        <p className={`text-sm text-muted-foreground ${align === 'start' ? 'text-left' : 'text-center'}`}>
          {disabledHint}
        </p>
      )}
    </div>
  );
}
