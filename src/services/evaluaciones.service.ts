import api, { ApiError } from '@/lib/api';

export interface EvaluacionContexto {
  intercambioId: number;
  soyComprador: boolean;
  yaEvaluado: boolean;
  evaluado: {
    id: number;
    nombre: string;
    nombreTienda?: string | null;
    profileSlug?: string | null;
    fotoPerfil?: string | null;
  } | null;
  marketItem?: {
    id: number;
    titulo: string;
    rubro: string;
    imagen: string;
  } | null;
  rubro: string;
  esServicio: boolean;
  labels: { item: string; atencion: string };
}

export interface EvaluacionPendiente {
  intercambioId: number;
  soyComprador: boolean;
  evaluadoId: number;
  evaluadoNombre: string | null;
  descripcion: string;
  fecha: string;
  marketItem?: { id: number; titulo: string; rubro: string; imagen: string } | null;
  rubro: string;
}

export const evaluacionesService = {
  async getContexto(intercambioId: number): Promise<EvaluacionContexto> {
    try {
      return await api.get<EvaluacionContexto>(`/api/evaluaciones/contexto/${intercambioId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al cargar evaluación', 500);
    }
  },

  async getPendientes(): Promise<EvaluacionPendiente[]> {
    try {
      return await api.get<EvaluacionPendiente[]>('/api/evaluaciones/pendientes');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al listar evaluaciones pendientes', 500);
    }
  },

  async crear(payload: {
    intercambioId: number;
    puntuacionItem?: number | null;
    puntuacionAtencion: number;
    comentario?: string;
  }): Promise<{ ok: boolean }> {
    try {
      return await api.post<{ ok: boolean }>('/api/evaluaciones', payload);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al enviar evaluación', 500);
    }
  },
};
