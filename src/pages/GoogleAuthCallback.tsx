import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { authService } from '@/services/auth.service';
import { ApiError } from '@/lib/api';
import {
  clearGoogleAuthPending,
  getGoogleAuthRedirectUri,
  loadGoogleAuthPending,
  markGoogleAuthCodeUsed,
} from '@/lib/google-oauth-redirect';

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

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

      if (!markGoogleAuthCodeUsed(code)) {
        return;
      }

      const pending = loadGoogleAuthPending();
      if (!pending) {
        setError('Sesión de Google expirada. Intentá de nuevo.');
        return;
      }

      const redirectUri = pending.redirectUri || getGoogleAuthRedirectUri();

      try {
        const { credential } = await authService.googleAuthCode({
          code,
          redirectUri,
        });

        await authService.googleAuth({
          credential,
          mode: pending.mode,
          ...pending.register,
        });

        clearGoogleAuthPending();
        navigate('/dashboard', { replace: true });
      } catch (err: unknown) {
        clearGoogleAuthPending();
        if (err instanceof ApiError) {
          if (
            pending.mode === 'login' &&
            err.status === 404 &&
            err.data?.code === 'GOOGLE_ACCOUNT_NOT_FOUND'
          ) {
            setError('No hay cuenta con ese Google. Creá una en registro o usá email y contraseña.');
          } else if (err.message.includes('invalid_grant')) {
            setError('El enlace de Google expiró o ya se usó. Volvé a intentar desde login o registro.');
          } else {
            setError(err.message);
          }
        } else {
          const msg = (err as Error).message || 'Error al conectar con Google';
          setError(msg.includes('invalid_grant')
            ? 'El enlace de Google expiró o ya se usó. Volvé a intentar desde login o registro.'
            : msg);
        }
      }
    };

    void run();
  }, [searchParams, navigate]);

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
