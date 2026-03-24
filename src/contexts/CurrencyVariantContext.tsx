import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { IXVariant } from '@/lib/currency';

const STORAGE_KEY = 'intercambius_ix_variant';

interface CurrencyVariantContextType {
  variant: IXVariant;
  setVariant: (v: IXVariant) => void;
  formatIX: (amountPesos: number) => string;
}

const CurrencyVariantContext = createContext<CurrencyVariantContextType | undefined>(undefined);

export const CurrencyVariantProvider = ({ children }: { children: ReactNode }) => {
  const [variant, setVariantState] = useState<IXVariant>('IOX-ARS');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as IXVariant | null;
    if (stored === 'IOX-ARS' || stored === 'IOX-USD' || stored === 'IX-ARS' || stored === 'IX-USD') {
      setVariantState(stored === 'IX-ARS' ? 'IOX-ARS' : stored === 'IX-USD' ? 'IOX-USD' : stored);
    }
  }, []);

  const setVariant = (v: IXVariant) => {
    setVariantState(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  const formatIXFn = (amountPesos: number): string => {
    if (variant === 'IOX-USD') {
      // 150000 IOX (pesos) = 100 IOX (USD). Se simplifica dividiendo por 1500.
      const ixUsd = amountPesos / 1500;
      return `${ixUsd.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true })} IOX`;
    }
    return `${amountPesos.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true })} IOX`;
  };

  return (
    <CurrencyVariantContext.Provider value={{ variant, setVariant, formatIX: formatIXFn }}>
      {children}
    </CurrencyVariantContext.Provider>
  );
};

export const useCurrencyVariant = () => {
  const context = useContext(CurrencyVariantContext);
  if (context === undefined) {
    throw new Error('useCurrencyVariant must be used within CurrencyVariantProvider');
  }
  return context;
};
