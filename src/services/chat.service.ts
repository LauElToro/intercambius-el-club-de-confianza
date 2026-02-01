import api, { ApiError } from '@/lib/api';

export interface Conversacion {
  id: number;
  otroUsuario: { id: number; nombre: string };
  marketItem?: { id: number; titulo: string; rubro: string; imagen: string };
  ultimoMensaje?: { contenido: string; createdAt: string } | null;
  updatedAt: string;
}

export interface Mensaje {
  id: number;
  senderId: number;
  senderNombre: string;
  contenido: string;
  leido: boolean;
  createdAt: string;
}

export interface ChatDetalle {
  conversacion: {
    id: number;
    otroUsuario: { id: number; nombre: string };
    marketItem?: { id: number; titulo: string; rubro: string; imagen: string; precio: number };
  };
  mensajes: Mensaje[];
}

export const chatService = {
  async getConversaciones(): Promise<Conversacion[]> {
    try {
      return await api.get<Conversacion[]>('/api/chat');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al cargar conversaciones', 500);
    }
  },

  async getMensajes(conversacionId: number): Promise<ChatDetalle> {
    try {
      return await api.get<ChatDetalle>(`/api/chat/${conversacionId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al cargar mensajes', 500);
    }
  },

  async enviarMensaje(conversacionId: number, contenido: string): Promise<Mensaje> {
    try {
      return await api.post<Mensaje>(`/api/chat/${conversacionId}`, { contenido });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al enviar mensaje', 500);
    }
  },
};
