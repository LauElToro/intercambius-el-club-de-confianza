/** Normaliza el slug personalizado: minúsculas, sin espacios, solo [a-z0-9-], 3–32 caracteres. */
export function normalizarSlugReferido(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugReferidoEsValido(slug: string): boolean {
  if (slug.length < 3 || slug.length > 32) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export function construirUrlReferido(slugOCodigo: string): string {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  const q = encodeURIComponent(slugOCodigo.trim());
  return `${base}/registro?ref=${q}`;
}
