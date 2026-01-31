import api, { ApiError } from '@/lib/api';
import { MarketItem } from './market.service';

export interface Coincidencia {
  item: MarketItem;
  diferenciaPrecio: number;
  porcentajeDiferencia: number;
}

export const coincidenciasService = {
  async getCoincidencias(userId: number): Promise<MarketItem[]> {
    try {
      const coincidencias = await api.get<Coincidencia[]>(`/api/coincidencias/${userId}`);
      // Extraer solo los items del array de coincidencias
      if (!Array.isArray(coincidencias)) {
        return [];
      }
      return coincidencias.map(c => c.item || c).filter(Boolean);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener coincidencias', 500);
    }
  },
};
