import api, { ApiError } from "@/lib/api";

export interface ReferidoListItem {
  id: number;
  nombre: string;
  email: string;
  fechaRegistro: string;
}

export interface ReferidosMeResponse {
  codigo: string;
  slugPersonalizado: string | null;
  totalReferidos: number;
  referidos: ReferidoListItem[];
}

export interface AdminReferidoFila {
  referidoId: number;
  referidoNombre: string;
  referidoEmail: string;
  referenteId: number | null;
  referenteNombre: string | null;
  referenteEmail?: string | null;
  codigoUsado: string | null;
  referidosDelReferente: number;
  fechaRegistro: string;
}

export interface AdminReferidosResponse {
  data: AdminReferidoFila[];
  total: number;
  page: number;
  totalPages: number;
  resumen?: {
    totalRegistrosConReferente: number;
    usuariosQueRefirieron: number;
    totalReferidos: number;
  };
}

export const referidosService = {
  async getMe(): Promise<ReferidosMeResponse> {
    try {
      return await api.get<ReferidosMeResponse>("/api/referidos/me");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Error al cargar referidos", 500);
    }
  },

  async updateSlug(slug: string): Promise<ReferidosMeResponse> {
    try {
      return await api.put<ReferidosMeResponse>("/api/referidos/me/slug", { slug });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Error al guardar el enlace", 500);
    }
  },
};
