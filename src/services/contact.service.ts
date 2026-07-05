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
    const body = {
      email: payload.email.trim(),
      categoria: payload.categoria,
      mensaje: payload.mensaje.trim(),
      ...(payload.nombre?.trim() ? { nombre: payload.nombre.trim() } : {}),
    };
    const hasFiles = (payload.attachments?.length ?? 0) > 0;

    try {
      if (!hasFiles) {
        return await api.post<{ ok: boolean; message?: string }>('/api/contact', body);
      }

      const fd = new FormData();
      fd.append('email', body.email);
      if (body.nombre) fd.append('nombre', body.nombre);
      fd.append('categoria', body.categoria);
      fd.append('mensaje', body.mensaje);
      payload.attachments!.slice(0, 5).forEach((file) => {
        fd.append('attachments', file);
      });
      return await api.postFormData<{ ok: boolean; message?: string }>('/api/contact', fd);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al enviar el mensaje', 500);
    }
  },
};
