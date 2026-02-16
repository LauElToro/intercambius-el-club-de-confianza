const API_URL = import.meta.env.VITE_API_URL || 'https://intercambios-backend.vercel.app';
const ADMIN_TOKEN_KEY = 'intercambius_admin_token';

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    throw new AdminApiError('Sesión de admin expirada', 401);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let data: unknown = {};
  if (text && response.headers.get('content-type')?.includes('application/json')) {
    try {
      data = JSON.parse(text);
    } catch {
      // ignore
    }
  }

  if (!response.ok) {
    throw new AdminApiError(
      (data as { error?: string })?.error || `Error ${response.status}`,
      response.status,
      data
    );
  }
  return data as T;
}

export interface AdminMetrics {
  usuarios: { total: number };
  productos: { total: number; activos: number };
  ventasCompras: {
    transaccionesTotal: number;
    comprasTotal: number;
    ventasTotal: number;
  };
  token: {
    saldoEnCirculacion: number;
    volumenTransacciones: number;
    tokenGastadoCompras: number;
    tokenRecibidoVentas: number;
  };
  contacto: {
    conversacionesTotal: number;
    mensajesTotal: number;
    paresUnicosContactados: number;
  };
}

export const adminService = {
  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  logout(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },

  async login(email: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${API_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AdminApiError((data as { error?: string }).error || 'Credenciales inválidas', response.status, data);
    }
    return data as { token: string };
  },

  async getMetrics(): Promise<AdminMetrics> {
    return adminRequest<AdminMetrics>('/api/admin/metrics');
  },

  async getUsers(page = 1, limit = 20): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return adminRequest(`/api/admin/users?page=${page}&limit=${limit}`);
  },

  async getProductos(page = 1, limit = 20): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return adminRequest(`/api/admin/productos?page=${page}&limit=${limit}`);
  },

  async getIntercambios(page = 1, limit = 20): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return adminRequest(`/api/admin/intercambios?page=${page}&limit=${limit}`);
  },

  async sendNewsletter(params: {
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    enviarATodos: boolean;
    emails?: string[];
  }): Promise<{ message: string; enviados: number; total: number; errores?: string[] }> {
    return adminRequest('/api/admin/newsletter', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
