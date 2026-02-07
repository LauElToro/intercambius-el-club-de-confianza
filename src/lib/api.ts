const API_URL = import.meta.env.VITE_API_URL || 'https://intercambios-backend.vercel.app';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('intercambius_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
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
  }

  if (!response.ok) {
    throw new ApiError(
      data.error || `HTTP error! status: ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  
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
  
  upload: async (file: File, tipo?: 'fotoPerfil' | 'banner' | 'market'): Promise<{ url: string; pathname: string; mediaType?: 'image' | 'video' }> => {
    const token = localStorage.getItem('intercambius_token');
    if (!token) {
      throw new ApiError('No autorizado', 401);
    }

    const formData = new FormData();
    formData.append('image', file);
    if (tipo) formData.append('tipo', tipo);

    const response = await fetch(`${API_URL}/api/upload`, {
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
      throw new ApiError(data.error || 'Error al subir la imagen', response.status, data);
    }

    return data;
  },
};

export default api;
