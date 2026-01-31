import api, { ApiError } from '@/lib/api';

export interface CheckoutResponse {
  id: number;
  usuarioId: number;
  otraPersonaId: number;
  otraPersonaNombre: string;
  descripcion: string;
  creditos: number;
  fecha: string;
  estado: string;
  marketItemId?: number;
}

export const checkoutService = {
  async pay(marketItemId: number): Promise<CheckoutResponse> {
    try {
      return await api.post<CheckoutResponse>(`/api/checkout/${marketItemId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al procesar el pago', 500);
    }
  },
};
