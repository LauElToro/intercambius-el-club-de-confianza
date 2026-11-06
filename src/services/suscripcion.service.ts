import api, { ApiError } from '@/lib/api';
import type { CodigoPlan } from '@/lib/suscripcion';

export type EstadoMercadoPago = {
  configurado: boolean;
  planesAutorizados: string[];
  kycPago: boolean;
};

export type CheckoutMercadoPago = {
  initPoint: string;
};

function mensaje(error: unknown, fallback: string): never {
  if (error instanceof ApiError) throw error;
  throw new ApiError(fallback, 500);
}

export const suscripcionService = {
  async estado(): Promise<EstadoMercadoPago> {
    try {
      return await api.get<EstadoMercadoPago>('/api/suscripcion/estado');
    } catch (error) {
      mensaje(error, 'No se pudo consultar la suscripción.');
    }
  },

  async checkout(plan: CodigoPlan): Promise<CheckoutMercadoPago> {
    try {
      return await api.post<CheckoutMercadoPago>('/api/suscripcion/checkout', { tipo: 'suscripcion', plan });
    } catch (error) {
      mensaje(error, 'No se pudo conectar con Mercado Pago.');
    }
  },

  async pagarKyc(): Promise<CheckoutMercadoPago> {
    try {
      return await api.post<CheckoutMercadoPago>('/api/suscripcion/checkout', { tipo: 'kyc' });
    } catch (error) {
      mensaje(error, 'No se pudo conectar con Mercado Pago.');
    }
  },
};
