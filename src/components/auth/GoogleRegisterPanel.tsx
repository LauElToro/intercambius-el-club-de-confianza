import { Link } from 'react-router-dom';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';
import type { GoogleAuthPendingRegister } from '@/lib/google-oauth-redirect';

interface GoogleRegisterPanelProps {
  register?: GoogleAuthPendingRegister;
  onError?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GoogleRegisterPanel({
  register,
  onError,
  disabled,
  loading,
}: GoogleRegisterPanelProps) {
  if (!isGoogleSignInEnabled) {
    return null;
  }

  return (
    <aside className="w-full min-w-0 max-w-[320px] shrink-0 self-start overflow-hidden rounded-2xl border border-border bg-card p-5 box-border">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Registro rápido</h2>
        <p className="text-sm text-muted-foreground">Continuá con tu cuenta de Google</p>
      </div>

      <GoogleSignInButton
        mode="register"
        register={register}
        align="start"
        onError={onError}
        disabled={disabled || loading}
      />

      <p className="mt-3 text-left text-xs leading-relaxed text-muted-foreground">
        Al registrarte con Google aceptás los{' '}
        <Link
          to="/terminos-generales"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          términos generales
        </Link>{' '}
        y los{' '}
        <Link
          to="/terminos"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          términos IOX
        </Link>
        .
      </p>

      {loading && (
        <p className="mt-3 text-sm text-muted-foreground">Conectando con Google...</p>
      )}
    </aside>
  );
}
