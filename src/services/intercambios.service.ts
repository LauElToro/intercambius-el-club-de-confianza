import api, { ApiError } from '@/lib/api';

export interface Intercambio {
  id: number;
  usuarioId: number;
  otraPersonaId: number;
  otraPersonaNombre: string;
  descripcion: string;
  creditos: number;
  fecha: string;
  estado: string;
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
