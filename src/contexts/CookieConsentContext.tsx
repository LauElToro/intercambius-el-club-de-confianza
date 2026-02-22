import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

const STORAGE_KEY = 'intercambius_cookie_consent';
/** 'essential' = solo necesarias | 'preferences' = + análisis/preferencias | 'all' = + marketing */
export type CookieLevel = 'essential' | 'preferences' | 'all' | null;

interface CookieConsentContextValue {
  /** null = aún no eligió, 'essential' | 'preferences' | 'all' = ya eligió */
  consent: CookieLevel;
  /** Si true, podemos registrar búsquedas y gustos para personalización */
  puedeRegistrarBusquedas: boolean;
  acceptEssential: () => void;
  acceptPreferences: () => void;
  acceptAll: () => void;
  /** Cerrar sin elegir (guarda 'essential' para que no vuelva a aparecer el banner) */
  dismiss: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieLevel>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as CookieLevel | null;
      if (stored === 'essential' || stored === 'preferences' || stored === 'all') {
        setConsent(stored);
      }
    } catch {
      // ignored
    }
  }, []);

  const save = useCallback((level: CookieLevel) => {
    setConsent(level);
    try {
      if (level) localStorage.setItem(STORAGE_KEY, level);
    } catch {
      // ignored
    }
  }, []);

  const value: CookieConsentContextValue = {
    consent,
    puedeRegistrarBusquedas: consent === 'preferences' || consent === 'all',
    acceptEssential: () => save('essential'),
    acceptPreferences: () => save('preferences'),
    acceptAll: () => save('all'),
    dismiss: () => save('essential'), // Por defecto, no tracking
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}
