import api, { ApiError } from '@/lib/api';
import { MarketItem } from './market.service';

export const favoritosService = {
  async getFavoritos(): Promise<MarketItem[]> {
    try {
      return await api.get<MarketItem[]>('/api/favoritos');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al obtener favoritos', 500);
    }
  },

  async toggleFavorito(marketItemId: number): Promise<{ favorito: boolean }> {
    try {
      return await api.post<{ favorito: boolean }>(`/api/favoritos/${marketItemId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al actualizar favorito', 500);
    }
  },

  async isFavorito(marketItemId: number): Promise<boolean> {
    try {
      const res = await api.get<{ favorito: boolean }>(`/api/favoritos/${marketItemId}`);
      return res.favorito;
    } catch (error) {
      return false;
    }
  },
};
