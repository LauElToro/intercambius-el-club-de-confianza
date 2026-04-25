import api, { ApiError } from '@/lib/api';

export type KycSyncResult = {
  kycVerificado: boolean;
  pending?: boolean;
  status?: string;
  code?: string;
};

export const kycService = {
  async startVerificationSession(): Promise<{ url: string }> {
    try {
      return await api.post<{ url: string }>('/api/kyc/session');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('No se pudo iniciar la verificación', 500);
    }
  },

  /** Tras volver de Didit: alinea `kycVerificado` con la API (complementa al webhook). */
  async syncFromDidit(sessionId?: string): Promise<KycSyncResult> {
    try {
      return await api.post<KycSyncResult>('/api/kyc/sync', sessionId ? { sessionId } : {});
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('No se pudo sincronizar la verificación', 500);
    }
  },
};
