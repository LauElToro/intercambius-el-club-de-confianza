import api, { ApiError } from '@/lib/api';

export const kycService = {
  async startVerificationSession(): Promise<{ url: string }> {
    try {
      return await api.post<{ url: string }>('/api/kyc/session');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('No se pudo iniciar la verificación', 500);
    }
  },
};
