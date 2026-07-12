/** Oculta errores técnicos de Prisma/DB en pantallas de login y registro. */
export function sanitizeAuthErrorMessage(message: string): string {
  const msg = message.trim();
  if (!msg) return 'No se pudo completar el inicio de sesión. Intentá de nuevo.';

  if (/planLimitReached|hold on your account/i.test(msg)) {
    return 'El servicio está temporalmente suspendido. Escribinos a noreply@intercambius.com.ar si persiste.';
  }
  if (/Can't reach database server|db\.prisma\.io|P1001|DATABASE_UNAVAILABLE/i.test(msg)) {
    return 'No pudimos conectar con el servidor. Intentá de nuevo en unos minutos.';
  }
  if (/Invalid `prisma\.|prisma\.\w+\(\)|invocation:/i.test(msg)) {
    return 'Error temporal del servidor. Intentá de nuevo en unos minutos.';
  }

  return msg;
}
