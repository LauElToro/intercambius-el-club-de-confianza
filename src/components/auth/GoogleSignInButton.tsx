import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onCredential, onError, disabled }: GoogleSignInButtonProps) {
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
    <div
      className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
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
        width="360"
      />
    </div>
  );
}
