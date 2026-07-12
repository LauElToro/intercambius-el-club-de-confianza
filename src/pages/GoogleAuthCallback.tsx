import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  clearGoogleAuthPending,
  getGoogleAuthRedirectUri,
  loadGoogleAuthPending,
  markGoogleAuthCodeUsed,
  type GoogleAuthPending,
} from '@/lib/google-oauth-redirect';
import { sanitizeAuthErrorMessage } from '@/lib/auth-error-message';

function getReturnPath(pending: GoogleAuthPending | null): '/login' | '/registro' {
  const path = pending?.returnPath ?? '/login';
  return path.includes('registro') ? '/registro' : '/login';
}

function redirectWithGoogleError(
  navigate: ReturnType<typeof useNavigate>,
  pending: GoogleAuthPending | null,
  message: string,
): void {
  const returnPath = getReturnPath(pending);
  navigate(`${returnPath}?google_error=${encodeURIComponent(sanitizeAuthErrorMessage(message))}`, { replace: true });
}

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle, registerWithGoogle } = useAuth();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const pending = loadGoogleAuthPending();
      const oauthError = searchParams.get('error');

      if (oauthError) {
        clearGoogleAuthPending();
        redirectWithGoogleError(
          navigate,
          pending,
          oauthError === 'access_denied'
            ? 'Cancelaste el inicio de sesión con Google.'
            : 'No se pudo completar el inicio de sesión con Google.',
        );
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        clearGoogleAuthPending();
        redirectWithGoogleError(navigate, pending, 'Respuesta de Google incompleta.');
        return;
      }

      if (!markGoogleAuthCodeUsed(code)) {
        redirectWithGoogleError(
          navigate,
          pending,
          'Este enlace de Google ya se utilizó. Volvé a intentar desde login o registro.',
        );
        return;
      }

      if (!pending) {
        redirectWithGoogleError(navigate, null, 'Sesión de Google expirada. Intentá de nuevo.');
        return;
      }

      const redirectUri = pending.redirectUri || getGoogleAuthRedirectUri();

      try {
        const { credential } = await authService.googleAuthCode({
          code,
          redirectUri,
        });

        if (pending.mode === 'register') {
          await registerWithGoogle(credential, pending.register ?? {});
        } else {
          await loginWithGoogle(credential);
        }

        clearGoogleAuthPending();
      } catch (err: unknown) {
        clearGoogleAuthPending();
        let message: string;

        if (err instanceof ApiError) {
          if (
            pending.mode === 'login' &&
            err.status === 404 &&
            err.data?.code === 'GOOGLE_ACCOUNT_NOT_FOUND'
          ) {
            message = 'No hay cuenta con ese Google. Creá una en registro o usá email y contraseña.';
          } else if (err.message.includes('invalid_grant')) {
            message = 'El enlace de Google expiró o ya se usó. Volvé a intentar desde login o registro.';
          } else {
            message = err.message;
          }
        } else {
          const raw = (err as Error).message || 'Error al conectar con Google';
          message = raw.includes('invalid_grant')
            ? 'El enlace de Google expiró o ya se usó. Volvé a intentar desde login o registro.'
            : raw;
        }

        console.error('[GoogleAuthCallback]', message, err);
        redirectWithGoogleError(navigate, pending, message);
      }
    };

    void run();
  }, [searchParams, navigate, loginWithGoogle, registerWithGoogle]);

  return (
    <Layout showHeader={false}>
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-muted-foreground">Conectando con Google...</p>
      </div>
    </Layout>
  );
};

export default GoogleAuthCallback;
