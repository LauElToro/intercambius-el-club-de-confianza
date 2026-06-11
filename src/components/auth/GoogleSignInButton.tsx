import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { isGoogleSignInEnabled } from '@/lib/google-oauth-config';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  disabledHint?: string;
  align?: 'start' | 'center';
  maxWidth?: number;
}

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled,
  disabledHint,
  align = 'start',
  maxWidth = 320,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(maxWidth);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const available = el.clientWidth;
      if (available <= 0) return;
      setButtonWidth(Math.min(maxWidth, Math.max(200, available)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxWidth]);

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
        ref={containerRef}
        className={`relative z-10 w-full max-w-full overflow-hidden ${align === 'start' ? 'flex justify-start' : 'flex justify-center'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
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
          width={String(buttonWidth)}
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
