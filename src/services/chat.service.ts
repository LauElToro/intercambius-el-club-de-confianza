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
  /** Iniciar o obtener conversación con vendedor. Pasar marketItemId o vendedorId */
  async iniciarConversacion(opts: { marketItemId?: number; vendedorId?: number }): Promise<{ conversacionId: number }> {
    try {
      const body = opts.marketItemId ? { marketItemId: opts.marketItemId } : opts.vendedorId ? { vendedorId: opts.vendedorId } : {};
      return await api.post<{ conversacionId: number }>('/api/chat/iniciar', body);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Error al iniciar conversación', 500);
    }
  },

  /** Prefijo para detectar mensaje estructurado de intercambio */
  INTERCAMBIO_PREFIX: '{"_t":"intercambio"',

  /** Iniciar conversación e inmediatamente enviar mensaje de intercambio. Para flujo de Coincidencias. */
  async iniciarIntercambio(opts: {
    marketItemId: number;
    miNombre: string;
    miProductoTitulo: string;
    miProductoUrl?: string;
    miProductoImagenUrl?: string;
    miProductoPrecio?: number;
    /** Producto del otro usuario que queremos (tu producto) */
    tuProductoTitulo: string;
    tuProductoUrl?: string;
    tuProductoImagenUrl?: string;
    tuProductoPrecio?: number;
  }): Promise<{ conversacionId: number }> {
    const { conversacionId } = await this.iniciarConversacion({ marketItemId: opts.marketItemId });
    const payload = {
      _t: 'intercambio',
      saludo: `¡Hola! Un gusto conectar, soy ${opts.miNombre.trim() || 'Intercambius'}`,
      miProducto: {
        titulo: opts.miProductoTitulo,
        imagen: opts.miProductoImagenUrl,
        url: opts.miProductoUrl,
        precio: opts.miProductoPrecio,
      },
      tuProducto: {
        titulo: opts.tuProductoTitulo,
        imagen: opts.tuProductoImagenUrl,
        url: opts.tuProductoUrl,
        precio: opts.tuProductoPrecio,
      },
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
