import api, { ApiError } from '@/lib/api';

export interface Notificacion {
  id: number;
  userId: number;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  leido: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  noLeidas: number;
}

export const notificacionesService = {
  async getNotificaciones(limit?: number, soloNoLeidas?: boolean): Promise<NotificacionesResponse> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (soloNoLeidas) params.append('leido', 'false');
      const qs = params.toString();
      return await api.get<NotificacionesResponse>(`/api/notificaciones${qs ? `?${qs}` : ''}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al obtener notificaciones', 500);
    }
  },

  async marcarLeida(id: number): Promise<void> {
    await api.patch(`/api/notificaciones/${id}/leer`);
  },

  async marcarTodasLeidas(): Promise<void> {
    await api.patch('/api/notificaciones/leer-todas');
  },
};
