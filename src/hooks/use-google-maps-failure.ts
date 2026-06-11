import { useEffect, useRef, useState } from 'react';
import { isGoogleMapsDisabledInSession, markGoogleMapsUnavailable } from '@/lib/google-maps';

const GOOGLE_MAP_ERROR_PATTERNS = [
  'ApiNotActivatedMapError',
  'ApiProjectMapError',
  'InvalidKeyMapError',
  'RefererNotAllowedMapError',
  'Google Maps JavaScript API error',
];

type WindowWithGm = Window & { gm_authFailure?: () => void };

function messageLooksLikeGoogleMapsFailure(args: unknown[]): boolean {
  const text = args.map(String).join(' ');
  return GOOGLE_MAP_ERROR_PATTERNS.some((p) => text.includes(p));
}

const failureListeners = new Set<() => void>();
let monitorsInstalled = false;
let previousConsoleError: typeof console.error;
let previousGmAuthFailure: (() => void) | undefined;

function notifyGoogleMapsFailure(): void {
  markGoogleMapsUnavailable();
  failureListeners.forEach((listener) => listener());
}

function installGoogleMapsFailureMonitors(): void {
  if (monitorsInstalled) return;
  monitorsInstalled = true;

  const w = window as WindowWithGm;
  previousGmAuthFailure = w.gm_authFailure;
  w.gm_authFailure = () => {
    notifyGoogleMapsFailure();
    previousGmAuthFailure?.();
  };

  previousConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (messageLooksLikeGoogleMapsFailure(args)) {
      notifyGoogleMapsFailure();
    }
    previousConsoleError(...args);
  };
}

function uninstallGoogleMapsFailureMonitors(): void {
  if (!monitorsInstalled || failureListeners.size > 0) return;
  monitorsInstalled = false;

  const w = window as WindowWithGm;
  w.gm_authFailure = previousGmAuthFailure;
  console.error = previousConsoleError;
}

/**
 * Detecta fallos de Google Maps que no propagan a React (p. ej. ApiNotActivatedMapError).
 * Persiste en sessionStorage para no reintentar en cada mapa de la sesión.
 */
export function useGoogleMapsFailure(onFailure?: () => void) {
  const [failed, setFailed] = useState(isGoogleMapsDisabledInSession);
  const onFailureRef = useRef(onFailure);
  onFailureRef.current = onFailure;

  const reportFailure = () => {
    markGoogleMapsUnavailable();
    setFailed(true);
    onFailureRef.current?.();
  };

  useEffect(() => {
    const listener = () => {
      setFailed(true);
      onFailureRef.current?.();
    };

    failureListeners.add(listener);
    installGoogleMapsFailureMonitors();

    return () => {
      failureListeners.delete(listener);
      uninstallGoogleMapsFailureMonitors();
    };
  }, []);

  return { failed, reportFailure };
}
