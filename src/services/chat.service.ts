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
  /**
   * Iniciar u obtener conversación.
   * - `intercambioId`: hilo por compra/intercambio (preferido desde Mis compras / Historial).
   * - `marketItemId`: contacto previo a la compra (una conversación por publicación entre las dos partes).
   * - `vendedorId`: chat genérico con el usuario.
   */
  async iniciarConversacion(opts: {
    intercambioId?: number;
    marketItemId?: number;
    vendedorId?: number;
  }): Promise<{ conversacionId: number }> {
    try {
      const body: Record<string, number> = {};
      if (opts.intercambioId != null) {
        body.intercambioId = opts.intercambioId;
      } else if (opts.marketItemId != null) {
        body.marketItemId = opts.marketItemId;
      } else if (opts.vendedorId != null) {
        body.vendedorId = opts.vendedorId;
      }
      return await api.post<{ conversacionId: number }>('/api/chat/iniciar', body);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al iniciar conversación', 500);
    }
  },

  /** Abre el chat de una compra/intercambio: usa conversacionId si ya viene del backend, si no pide una por intercambioId. */
  async abrirChatIntercambio(i: { id: number; conversacionId?: number | null }): Promise<{ conversacionId: number }> {
    if (i.conversacionId != null && i.conversacionId > 0) {
      return { conversacionId: i.conversacionId };
    }
    return this.iniciarConversacion({ intercambioId: i.id });
  },

  /** Prefijo para detectar mensaje estructurado de intercambio */
  INTERCAMBIO_PREFIX: '{"_t":"intercambio"',

  /** Iniciar conversación e inmediatamente enviar UN SOLO mensaje de intercambio con cards. */
  async iniciarIntercambio(opts: {
    marketItemId: number;
    miNombre: string;
    miProducto: { titulo: string; descripcion?: string; imagen?: string; url?: string; precio?: number; rubro?: string };
    tuProducto: { titulo: string; descripcion?: string; imagen?: string; url?: string; precio?: number; rubro?: string };
  }): Promise<{ conversacionId: number }> {
    const { conversacionId } = await this.iniciarConversacion({ marketItemId: opts.marketItemId });
    const payload = {
      _t: 'intercambio',
      saludo: `¡Hola! Un gusto conectar, soy ${opts.miNombre.trim() || 'Intercambius'}`,
      miProducto: opts.miProducto,
      tuProducto: opts.tuProducto,
    };
    await this.enviarMensaje(conversacionId, JSON.stringify(payload));
    return { conversacionId };
  },

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
