import api, { ApiError } from '@/lib/api';

export interface VendedorInfo {
  id: number;
  nombre: string;
  avatar?: string;
  contacto?: string;
  rating: number;
  totalResenas: number;
  ubicacion?: string;
  miembroDesde?: string;
  verificado?: boolean;
}

export interface ProductMedia {
  url: string;
  alt?: string;
  position?: number;
  isPrimary?: boolean;
  mediaType?: 'image' | 'video';
}

export interface MarketItem {
  id: number;
  titulo: string;
  descripcion: string;
  descripcionCompleta?: string; // legacy, usar descripcion
  precio: number;
  tipoPago?: string; // ix | convenir | pesos | ix_pesos
  rubro: 'servicios' | 'productos' | 'alimentos' | 'experiencias';
  ubicacion: string;
  lat?: number;
  lng?: number;
  distancia?: number;
  imagen: string;
  vendedorId: number;
  rating: number;
  detalles?: Record<string, string>;
  caracteristicas?: string[];
  images?: ProductMedia[];
  createdAt: string;
  updatedAt: string;
  vendedor?: VendedorInfo | null;
}

export interface MarketItemFilters {
  rubro?: 'servicios' | 'productos' | 'alimentos' | 'experiencias' | 'todos';
  tipo?: 'productos' | 'servicios';
  precioMin?: number;
  precioMax?: number;
  vendedorId?: number;
  search?: string;
  userLat?: number;
  userLng?: number;
  distanciaMax?: number;
  page?: number;
  limit?: number;
}

export interface MarketItemsResponse {
  data: MarketItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMarketItemData {
  titulo: string;
  descripcion: string;
  precio: number;
  tipoPago?: string;
  rubro: 'servicios' | 'productos' | 'alimentos' | 'experiencias';
  ubicacion: string;
  lat?: number;
  lng?: number;
  distancia?: number;
  imagen: string;
  images?: ProductMedia[];
  detalles?: Record<string, string>;
  caracteristicas?: string[];
}

export const marketService = {
  async getItems(filters?: MarketItemFilters): Promise<MarketItemsResponse> {
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
      if (filters?.userLat !== undefined) {
        params.append('userLat', filters.userLat.toString());
      }
      if (filters?.userLng !== undefined) {
        params.append('userLng', filters.userLng.toString());
      }
      if (filters?.distanciaMax !== undefined) {
        params.append('distanciaMax', filters.distanciaMax.toString());
      }
      if (filters?.page !== undefined) {
        params.append('page', filters.page.toString());
      }
      if (filters?.limit !== undefined) {
        params.append('limit', filters.limit.toString());
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/api/market?${queryString}` : '/api/market';
      
      return await api.get<MarketItemsResponse>(endpoint);
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
