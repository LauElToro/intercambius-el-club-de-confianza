import api, { ApiError } from '@/lib/api';

export type CategoriaContacto = 'queja' | 'sugerencia' | 'consulta' | 'otro';

export interface SendContactPayload {
  email: string;
  nombre?: string;
  categoria: CategoriaContacto;
  mensaje: string;
  attachments?: File[];
}

export const contactService = {
  async send(payload: SendContactPayload): Promise<{ ok: boolean; message?: string }> {
    const fd = new FormData();
    fd.append('email', payload.email.trim());
    if (payload.nombre?.trim()) {
      fd.append('nombre', payload.nombre.trim());
    }
    fd.append('categoria', payload.categoria);
    fd.append('mensaje', payload.mensaje.trim());
    (payload.attachments || []).slice(0, 5).forEach((file) => {
      fd.append('attachments', file);
    });
    try {
      return await api.postFormData<{ ok: boolean; message?: string }>('/api/contact', fd);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al enviar el mensaje', 500);
    }
  },
};
