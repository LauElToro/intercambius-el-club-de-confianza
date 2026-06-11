/** Email canónico: trim + minúsculas (login, registro, reset). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
