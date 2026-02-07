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
  const [variant, setVariantState] = useState<IXVariant>('IX-ARS');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as IXVariant | null;
    if (stored === 'IX-ARS' || stored === 'IX-USD') {
      setVariantState(stored);
    }
  }, []);

  const setVariant = (v: IXVariant) => {
    setVariantState(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  const formatIXFn = (amountPesos: number): string => {
    if (variant === 'IX-USD') {
      // 150000 IX (pesos) = 100 IX (USD). Se simplifica dividiendo por 1500.
      const ixUsd = amountPesos / 1500;
      return `${ixUsd.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true })} IX`;
    }
    return `${amountPesos.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true })} IX`;
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
