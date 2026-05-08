/** Coincide enlace del menú con la ubicación actual (incluye query string si el `to` la trae). */
export function navLinkIsActive(to: string, pathname: string, search: string): boolean {
  const q = to.indexOf("?");
  const path = q === -1 ? to : to.slice(0, q);
  if (pathname !== path) return false;
  if (q === -1) return true;
  const want = new URLSearchParams(to.slice(q + 1));
  const have = new URLSearchParams(search);
  for (const [k, v] of want.entries()) {
    if (have.get(k) !== v) return false;
  }
  return true;
}

export function isNavItemActive(to: string, pathname: string, search: string): boolean {
  if (to.includes("?")) return navLinkIsActive(to, pathname, search);
  if (to === "/market") return pathname.startsWith("/market");
  return pathname === to || pathname.startsWith(`${to}/`);
}
