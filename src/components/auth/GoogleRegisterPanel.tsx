import { Link } from 'react-router-dom';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';

interface GoogleRegisterPanelProps {
  onCredential: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GoogleRegisterPanel({
  onCredential,
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
        align="start"
        onCredential={onCredential}
        onError={onError}
        disabled={disabled}
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
