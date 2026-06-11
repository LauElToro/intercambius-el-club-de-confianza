import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';

interface GoogleLoginPanelProps {
  onError?: (message: string) => void;
  disabled?: boolean;
  error?: string;
}

export function GoogleLoginPanel({ onError, disabled, error }: GoogleLoginPanelProps) {
  if (!isGoogleSignInEnabled) {
    return null;
  }

  return (
    <aside className="w-full min-w-0 max-w-[320px] shrink-0 self-start overflow-hidden rounded-2xl border border-border bg-card p-5 box-border">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Inicio rápido</h2>
        <p className="text-sm text-muted-foreground">Entrá con tu cuenta de Google</p>
      </div>

      <GoogleSignInButton
        mode="login"
        align="start"
        onError={onError}
        disabled={disabled}
      />
      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </aside>
  );
}
