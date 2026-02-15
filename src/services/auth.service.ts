import api, { ApiError } from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  contacto: string;
  ubicacion?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MfaRequiredResponse {
  mfaRequired: true;
  mfaToken: string;
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  contacto: string;
  saldo: number;
  limite: number;
  rating?: number;
  totalResenas: number;
  ubicacion: string;
  verificado: boolean;
  miembroDesde: string;
  bio?: string;
  fotoPerfil?: string;
  banner?: string;
  redesSociales?: Record<string, string>;
  ofrece?: string;
  necesita?: string;
  precioOferta?: number;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse | MfaRequiredResponse> {
    try {
      const response = await api.post<AuthResponse | MfaRequiredResponse>('/api/auth/login', credentials);

      if ('mfaRequired' in response && response.mfaRequired) {
        return response;
      }

      const authResponse = response as AuthResponse;
      localStorage.setItem('intercambius_token', authResponse.token);
      localStorage.setItem('intercambius_user', JSON.stringify(authResponse.user));
      return authResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al iniciar sesión', 500);
    }
  },

  async verifyMfa(mfaToken: string, code: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/verify-mfa', { mfaToken, code });
      localStorage.setItem('intercambius_token', response.token);
      localStorage.setItem('intercambius_user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al verificar el código', 500);
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, newPassword });
  },

  async register(data: RegisterData): Promise<User | MfaRequiredResponse> {
    try {
      await api.post<User>('/api/auth/register', data);

      const loginResponse = await this.login({
        email: data.email,
        password: data.password,
      });

      if ('mfaRequired' in loginResponse && loginResponse.mfaRequired) {
        return loginResponse;
      }
      return (loginResponse as AuthResponse).user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al registrarse', 500);
    }
  },

  logout(): void {
    localStorage.removeItem('intercambius_token');
    localStorage.removeItem('intercambius_user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('intercambius_user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async refreshFromApi(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const user = await import('@/services/user.service').then(m => m.userService.getCurrentUser());
      localStorage.setItem('intercambius_user', JSON.stringify(user));
      return user;
    } catch {
      return this.getCurrentUser();
    }
  },

  getToken(): string | null {
    return localStorage.getItem('intercambius_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
