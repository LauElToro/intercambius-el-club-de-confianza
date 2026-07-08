import api, { ApiError } from '@/lib/api';
import { User } from './auth.service';
import { nombreTiendaParaAsignar } from '@/lib/perfil';

async function asegurarNombreTienda(user: User): Promise<User> {
  const nombreTienda = nombreTiendaParaAsignar(user);
  if (!nombreTienda) return user;
  try {
    return await api.put<User>('/api/users/me', { nombreTienda });
  } catch {
    return user;
  }
}

export const userService = {
  async getCurrentUser(): Promise<User> {
    try {
      const user = await api.get<User>('/api/users/me');
      return asegurarNombreTienda(user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener el usuario', 500);
    }
  },

  async updateUser(data: Partial<User>): Promise<User> {
    try {
      return await api.put<User>('/api/users/me', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al actualizar el usuario', 500);
    }
  },

  async getUser(idOrSlug: string | number): Promise<User> {
    try {
      const user = await api.get<User>(`/api/users/${idOrSlug}`);
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener el usuario', 500);
    }
  },

  /** @deprecated Usar getUser */
  async getUserById(id: number): Promise<User> {
    return this.getUser(id);
  },
};
