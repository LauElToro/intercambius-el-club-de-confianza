import api, { ApiError } from '@/lib/api';
import { User } from './auth.service';

export const userService = {
  async getCurrentUser(): Promise<User> {
    try {
      return await api.get<User>('/api/users/me');
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

  async getUserById(id: number): Promise<User> {
    try {
      return await api.get<User>(`/api/users/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Error al obtener el usuario', 500);
    }
  },
};
