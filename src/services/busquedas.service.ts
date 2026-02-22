import api from '@/lib/api';

export type SeccionBusqueda = 'market' | 'coincidencias';

export interface RegistrarBusquedaParams {
  termino: string;
  seccion: SeccionBusqueda;
  filtros?: Record<string, unknown>;
}

/** Registra una búsqueda en el backend (solo si el usuario aceptó cookies de preferencias) */
export const busquedasService = {
  async registrar(params: RegistrarBusquedaParams): Promise<void> {
    try {
      await api.post('/api/busquedas', params);
    } catch {
      // Silencioso: no queremos afectar la UX si falla el registro
    }
  },
};
