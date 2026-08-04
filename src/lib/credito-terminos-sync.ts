import { userService } from '@/services/user.service';
import type { User } from '@/services/auth.service';
import {
  getCreditoAceptadoLocal,
  setCreditoAceptadoLocal,
} from '@/components/credito/OfertaCreditoTerminos';

/**
 * Sincroniza la respuesta guardada en localStorage con el backend (usuarios que aceptaron
 * antes de que existiera el endpoint). Idempotente.
 */
export async function syncTerminosCreditoFromLocalStorage(
  userId: number,
  user?: Pick<User, 'aceptaTerminosCredito'> | null,
): Promise<boolean> {
  if (user?.aceptaTerminosCredito === true || user?.aceptaTerminosCredito === false) {
    return false;
  }

  const local = getCreditoAceptadoLocal(userId);
  if (local !== 'aceptado' && local !== 'rechazado') {
    return false;
  }

  const result = await userService.setTerminosCredito(local === 'aceptado');
  setCreditoAceptadoLocal(userId, result.aceptaTerminosCredito ? 'aceptado' : 'rechazado');
  return true;
}
