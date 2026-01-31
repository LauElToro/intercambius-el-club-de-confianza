import api, { ApiError } from '@/lib/api';

export interface MarketItem {
  id: number;
  titulo: string;
  descripcion: string;
  descripcionCompleta?: string;
  precio: number;
  rubro: 'servicios' | 'productos' | 'alimentos' | 'experiencias';
  ubicacion: string;
  distancia?: number;
  imagen: string;
  vendedorId: number;
  rating: number;
  detalles?: Record<string, string>;
  caracteristicas?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketItemFilters {
  rubro?: 'servicios' | 'productos' | 'alimentos' | 'experiencias' | 'todos';
  tipo?: 'productos' | 'servicios';
  precioMin?: number;
  precioMax?: number;
  vendedorId?: number;
  search?: string;
}

export interface CreateMarketItemData {
  titulo: string;
  descripcion: string;
  descripcionCompleta?: string;
  precio: number;
  rubro: 'servicios' | 'productos' | 'alimentos' | 'experiencias';
  ubicacion: string;
  distancia?: number;
  imagen: string;
  detalles?: Record<string, string>;
  caracteristicas?: string[];
}

export const marketService = {
  async getItems(filters?: MarketItemFilters): Promise<MarketItem[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.rubro && filters.rubro !== 'todos') {
        params.append('rubro', filters.rubro);
      }
      if (filters?.tipo) {
        params.append('tipo', filters.tipo);
      }
      if (filters?.precioMin !== undefined) {
        params.append('precioMin', filters.precioMin.toString());
      }
      if (filters?.precioMax !== undefined) {
        params.append('precioMax', filters.precioMax.toString());
      }
      if (filters?.vendedorId) {
        params.append('vendedorId', filters.vendedorId.toString());
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/api/market?${queryString}` : '/api/market';
      
      return await api.get<MarketItem[]>(endpoint);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener items del market', 500);
    }
  },

  async getItemById(id: number): Promise<MarketItem> {
    try {
      return await api.get<MarketItem>(`/api/market/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener el item', 500);
    }
  },

  async createItem(data: CreateMarketItemData): Promise<MarketItem> {
    try {
      return await api.post<MarketItem>('/api/market', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al crear el item', 500);
    }
  },

  async updateItem(id: number, data: Partial<CreateMarketItemData>): Promise<MarketItem> {
    try {
      return await api.put<MarketItem>(`/api/market/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al actualizar el item', 500);
    }
  },

  async deleteItem(id: number): Promise<void> {
    try {
      await api.delete(`/api/market/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al eliminar el item', 500);
    }
  },
};
