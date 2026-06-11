import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api';
import {
  clearGoogleAuthPending,
  getGoogleAuthRedirectUri,
  loadGoogleAuthPending,
} from '@/lib/google-oauth-redirect';

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, registerWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const oauthError = searchParams.get('error');
      if (oauthError) {
        setError('No se pudo completar el inicio de sesión con Google.');
        clearGoogleAuthPending();
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        setError('Respuesta de Google incompleta.');
        clearGoogleAuthPending();
        return;
      }

      const pending = loadGoogleAuthPending();
      if (!pending) {
        setError('Sesión de Google expirada. Intentá de nuevo.');
        return;
      }

      try {
        const redirectUri = getGoogleAuthRedirectUri();
        const { credential } = await authService.googleAuthCode({
          code,
          redirectUri,
        });

        if (cancelled) return;

        if (pending.mode === 'register') {
          await registerWithGoogle(credential, pending.register ?? {});
        } else {
          await loginWithGoogle(credential);
        }
        clearGoogleAuthPending();
      } catch (err: unknown) {
        if (cancelled) return;
        clearGoogleAuthPending();
        if (err instanceof ApiError) {
          if (
            pending.mode === 'login' &&
            err.status === 404 &&
            err.data?.code === 'GOOGLE_ACCOUNT_NOT_FOUND'
          ) {
            setError('No hay cuenta con ese Google. Creá una en registro o usá email y contraseña.');
          } else {
            setError(err.message);
          }
        } else {
          setError((err as Error).message || 'Error al conectar con Google');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, loginWithGoogle, registerWithGoogle]);

  return (
    <Layout showHeader={false}>
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center gap-4">
        {!error ? (
          <p className="text-muted-foreground">Conectando con Google...</p>
        ) : (
          <>
            <p className="text-destructive max-w-md">{error}</p>
            <Link to="/login" className="text-gold hover:underline font-medium">
              Volver al login
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
};

export default GoogleAuthCallback;
