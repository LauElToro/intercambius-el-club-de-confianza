/** Arma la lista de términos para coincidencias (~70 % fuzzy match). */
export function parseNecesitaTerms(necesita?: string): string[] {
  const raw = necesita?.trim();
  if (!raw) return [];
  const parts = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  return parts.length > 0 ? parts : raw.length >= 2 ? [raw] : [];
}

export function buildTerminosInteres(
  interesesQuiero?: string[],
  necesita?: string,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (t: string) => {
    const s = String(t).trim();
    if (s.length < 2) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };
  for (const t of interesesQuiero ?? []) add(t);
  for (const t of parseNecesitaTerms(necesita)) add(t);
  return out;
}
