import api, { ApiError } from '@/lib/api';
import { MarketItem } from './market.service';

export const coincidenciasService = {
  async getCoincidencias(userId: number): Promise<MarketItem[]> {
    try {
      return await api.get<MarketItem[]>(`/api/coincidencias?userId=${userId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener coincidencias', 500);
    }
  },
};
