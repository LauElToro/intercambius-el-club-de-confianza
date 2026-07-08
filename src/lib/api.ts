import {
  isPublicAuthEndpoint,
  isPublicReadEndpoint,
  notifyAuthSessionInvalid,
  shouldInvalidateUserSession,
} from '@/lib/auth-session';
import { API_BASE_URL, buildApiUrl } from '@/lib/api-config';

export class ApiError extends Error {
  /** Si true, ya se disparó cierre de sesión / redirección; no mostrar otro toast genérico. */
  sessionInvalidated = false;

  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & { __authRetried?: boolean };

function throwApiError(
  endpoint: string,
  status: number,
  message: string,
  data?: any
): never {
  const hadToken = !!localStorage.getItem('intercambius_token');
  const msg = message || `HTTP error! status: ${status}`;
  if (
    hadToken &&
    !isPublicAuthEndpoint(endpoint) &&
    !isPublicReadEndpoint(endpoint) &&
    shouldInvalidateUserSession(status, msg)
  ) {
    notifyAuthSessionInvalid();
    const err = new ApiError(msg, status, data);
    err.sessionInvalidated = true;
    throw err;
  }
  throw new ApiError(msg, status, data);
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const token = localStorage.getItem('intercambius_token');
  if (!token) return false;
  try {
    const response = await fetch(buildApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await response.text();
    if (!response.ok) return false;
    const data = text ? JSON.parse(text) : {};
    if (data && typeof data.token === 'string') {
      localStorage.setItem('intercambius_token', data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** GET sin Authorization (perfiles públicos, market, etc.). Si falla con 401 y había token, reintenta sin él. */
async function requestPublic<T>(endpoint: string): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const text = await response.text();
  let data: any = {};
  if (isJson && text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError('Error al procesar la respuesta del servidor', response.status);
    }
  }
  if (!response.ok) {
    const msg =
      typeof data?.error === 'string' ? data.error : `HTTP error! status: ${response.status}`;
    throw new ApiError(msg, response.status, data);
  }
  return data as T;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { __authRetried: authRetried, ...fetchInit } = options;
  const token = localStorage.getItem('intercambius_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchInit.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(buildApiUrl(endpoint), {
    ...fetchInit,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any = {};
  const text = await response.text();

  if (response.status === 204 || text.length === 0) {
    data = {};
  } else if (isJson) {
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new ApiError(
        'Error al procesar la respuesta del servidor',
        response.status,
        { raw: text.substring(0, 200) }
      );
    }
  } else if (!response.ok) {
    throw new ApiError(
      `El servidor devolvió una respuesta no válida (${response.status})`,
      response.status,
      { html: text.substring(0, 200) }
    );
  } else if (text.trimStart().startsWith('<')) {
    throw new ApiError(
      `La API no respondió JSON (revisá VITE_API_URL, actual: ${API_BASE_URL})`,
      response.status,
      { html: text.substring(0, 200) }
    );
  }

  if (!response.ok) {
    const msg =
      typeof data?.error === 'string' ? data.error : `HTTP error! status: ${response.status}`;
    const hadToken = !!localStorage.getItem('intercambius_token');
    if (
      !authRetried &&
      hadToken &&
      !isPublicAuthEndpoint(endpoint) &&
      !isPublicReadEndpoint(endpoint) &&
      shouldInvalidateUserSession(response.status, msg)
    ) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        return request<T>(endpoint, { ...options, __authRetried: true });
      }
    }
    throwApiError(endpoint, response.status, msg, data);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  /** GET sin enviar token (perfiles públicos). */
  getPublic: <T>(endpoint: string) => requestPublic<T>(endpoint),
  
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  /** POST multipart/form-data (no fijar Content-Type; el navegador define boundary). */
  postFormData: async <T>(endpoint: string, formData: FormData, authRetried = false): Promise<T> => {
    const token = localStorage.getItem('intercambius_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers,
      body: formData,
    });
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    let data: any = {};
    const text = await response.text();
    if (isJson && text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new ApiError('Error al procesar la respuesta del servidor', response.status);
      }
    }
    if (!response.ok) {
      const msg =
        typeof data?.error === 'string' ? data.error : `HTTP error! status: ${response.status}`;
      const hadToken = !!localStorage.getItem('intercambius_token');
      if (
        !authRetried &&
        hadToken &&
        !isPublicAuthEndpoint(endpoint) &&
        shouldInvalidateUserSession(response.status, msg)
      ) {
        const refreshed = await tryRefreshAccessToken();
        if (refreshed) {
          return api.postFormData<T>(endpoint, formData, true);
        }
      }
      throwApiError(endpoint, response.status, msg, data);
    }
    return data as T;
  },
  
  upload: async (
    file: File,
    tipo?: 'fotoPerfil' | 'banner' | 'market',
    authRetried = false
  ): Promise<{ url: string; pathname: string; mediaType?: 'image' | 'video' }> => {
    const token = localStorage.getItem('intercambius_token');
    if (!token) {
      throw new ApiError('No autorizado', 401);
    }

    const formData = new FormData();
    formData.append('image', file);
    if (tipo) formData.append('tipo', tipo);

    const response = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      throw new ApiError(
        `Error al subir la imagen (${response.status})`,
        response.status,
        { html: text.substring(0, 200) }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      const msg = typeof data?.error === 'string' ? data.error : 'Error al subir la imagen';
      const hadToken = !!localStorage.getItem('intercambius_token');
      if (
        !authRetried &&
        hadToken &&
        shouldInvalidateUserSession(response.status, msg)
      ) {
        const refreshed = await tryRefreshAccessToken();
        if (refreshed) {
          return api.upload(file, tipo, true);
        }
      }
      throwApiError('/api/upload', response.status, msg, data);
    }

    return data;
  },
};

export default api;
