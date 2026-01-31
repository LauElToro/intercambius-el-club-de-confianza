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
        console.warn('Coincidencias no es un array:', coincidencias);
        return [];
      }
      const items = coincidencias
        .map(c => {
          // Si c tiene la propiedad 'item', usar esa, sino usar c directamente
          if (c && typeof c === 'object' && 'item' in c) {
            return (c as Coincidencia).item;
          }
          return c as MarketItem;
        })
        .filter((item): item is MarketItem => 
          item !== null && 
          item !== undefined && 
          typeof item === 'object' && 
          'id' in item && 
          'titulo' in item
        );
      return items;
    } catch (error) {
      console.error('Error al obtener coincidencias:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener coincidencias', 500);
    }
  },
};
