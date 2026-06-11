import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  disabledHint?: string;
  align?: 'start' | 'center';
}

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled,
  disabledHint,
  align = 'start',
}: GoogleSignInButtonProps) {
  if (!isGoogleSignInEnabled) {
    return null;
  }

  const handleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      onCredential(response.credential);
    } else {
      onError?.();
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative z-10 flex w-full ${align === 'start' ? 'justify-start' : 'justify-center'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={disabled}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError?.()}
          locale="es"
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
          width="320"
        />
      </div>
      {disabledHint && (
        <p className={`text-sm text-muted-foreground ${align === 'start' ? 'text-left' : 'text-center'}`}>
          {disabledHint}
        </p>
      )}
    </div>
  );
}
