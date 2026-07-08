/** Ruta pública de perfil: slug personalizado si existe, si no id numérico (legacy). */
export function perfilPath(user: { id: number; profileSlug?: string | null }): string {
  const slug = user.profileSlug?.trim();
  if (slug) return `/perfil/${slug}`;
  return `/perfil/${user.id}`;
}

type UsuarioNombre = {
  nombre?: string | null;
  nombreTienda?: string | null;
};

/** Nombre de tienda por defecto cuando el usuario no configuró uno. */
export function nombreTiendaPorDefecto(user: UsuarioNombre | null | undefined): string {
  const nombre = user?.nombre?.trim();
  return nombre || 'Mi tienda';
}

/** Valor efectivo de nombreTienda (nunca vacío si hay nombre de cuenta). */
export function nombreTiendaEfectivo(user: UsuarioNombre | null | undefined): string {
  const tienda = user?.nombreTienda?.trim();
  if (tienda) return tienda;
  return nombreTiendaPorDefecto(user);
}

/** Nombre visible en perfil y publicaciones: tienda si hay, si no nombre de cuenta. */
export function nombrePublico(user: UsuarioNombre | null | undefined): string {
  if (!user) return 'Usuario';
  const tienda = user.nombreTienda?.trim();
  const nombre = user.nombre?.trim();
  return tienda || nombre || 'Usuario';
}

/** Payload para persistir nombreTienda cuando falta (usa el nombre de cuenta). */
export function nombreTiendaParaAsignar(user: UsuarioNombre | null | undefined): string | null {
  if (user?.nombreTienda?.trim()) return null;
  const def = nombreTiendaPorDefecto(user);
  return def === 'Mi tienda' ? null : def;
}

/** Normaliza el slug que el usuario escribe (preview en el formulario). */
export function sanitizeProfileSlugInput(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48);
}

export function validateProfileSlugClient(slug: string): string | null {
  if (!slug) return 'La URL no puede estar vacía';
  if (slug.length < 3) return 'Mínimo 3 caracteres';
  if (slug.length > 48) return 'Máximo 48 caracteres';
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && !/^[a-z0-9]{3}$/.test(slug)) {
    return 'Solo letras, números y guiones';
  }
  if (/^\d+$/.test(slug)) return 'No puede ser solo números';
  return null;
}
