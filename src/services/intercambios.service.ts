import api, { ApiError } from '@/lib/api';

export interface MarketItemEnIntercambio {
  id: number;
  titulo: string;
  descripcion: string;
  descripcionCompleta?: string;
  precio: number;
  rubro: string;
  ubicacion?: string;
  imagen: string;
  imagenPrincipal?: string;
  imagenes?: { url: string; alt?: string }[];
  condition?: string;
  availability?: string;
  tipoPago?: string;
  detalles?: Record<string, string>;
  caracteristicas?: string[];
  rating?: number;
}

export interface Intercambio {
  id: number;
  usuarioId: number;
  otraPersonaId: number;
  otraPersonaNombre: string;
  descripcion: string;
  creditos: number;
  fecha: string;
  estado: string;
  marketItemId?: number;
  marketItem?: MarketItemEnIntercambio | null;
  createdAt?: string;
  updatedAt?: string;
}

export const intercambiosService = {
  async getByUserId(userId: number): Promise<Intercambio[]> {
    try {
      return await api.get<Intercambio[]>(`/api/intercambios/${userId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener intercambios', 500);
    }
  },
};
