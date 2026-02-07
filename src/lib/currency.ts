// IX en pesos (base) y IX en USD
// 150000 pesos = 100 USD → 1 USD = 1500 pesos
export const IX_PESOS_PER_USD = 1500;

export type IXVariant = 'IX-ARS' | 'IX-USD';

export const convertToUSD = (pesos: number): number => pesos / IX_PESOS_PER_USD;

export const formatIX = (amountPesos: number, variant: IXVariant): string => {
  if (variant === 'IX-USD') {
    const ixUsd = amountPesos / IX_PESOS_PER_USD;
    return `${ixUsd.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: true })} IX`;
  }
  return `${amountPesos.toLocaleString('es-AR')} IX`;
};

export const getIXSuffix = (variant: IXVariant): string => ' IX';

// Legacy - para compatibilidad
export const formatCurrency = (amount: number, currency: 'IX' | 'ARS' = 'IX'): string => {
  if (currency === 'ARS') {
    return `$${amount.toLocaleString('es-AR')}`;
  }
  return `${amount.toLocaleString('es-AR')} IX`;
};

/** Formatea un valor numérico (string de dígitos) con separador de miles para input */
export const formatPrecioForInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true });
};

/** Parsea el valor del input de precio a número (solo dígitos) */
export const parsePrecioFromInput = (value: string): number => {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};
