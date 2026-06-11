import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';

interface GoogleLoginPanelProps {
  onError?: () => void;
  disabled?: boolean;
}

export function GoogleLoginPanel({ onError, disabled }: GoogleLoginPanelProps) {
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
    </aside>
  );
}
