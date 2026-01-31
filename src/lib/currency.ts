// Conversión temporal de IX a pesos argentinos
// TODO: Integrar con API de cotización en tiempo real
const IX_TO_PESOS = 1; // 1 IX = 1 peso argentino (temporal)

export const convertIXToPesos = (ix: number): number => {
  return ix * IX_TO_PESOS;
};

export const convertPesosToIX = (pesos: number): number => {
  return pesos / IX_TO_PESOS;
};

export const formatCurrency = (amount: number, currency: 'IX' | 'ARS' = 'IX'): string => {
  if (currency === 'ARS') {
    return `$${amount.toLocaleString('es-AR')}`;
  }
  return `${amount} IX`;
};

export const LIMITE_CREDITO_NEGATIVO_PESOS = 15000; // pesos argentinos
export const LIMITE_CREDITO_NEGATIVO = LIMITE_CREDITO_NEGATIVO_PESOS; // Alias para compatibilidad
