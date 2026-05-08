/**
 * Coincidencia entre lo que el usuario escribe en la Tabla y título/descripción del market.
 * Umbral principal ~70 % (typos, plurales, palabras sueltas). Umbral menor para sugerencias «parecidas».
 */

/** Coincidencia fuerte: artículo cuenta como match razonable con la publicación. */
export const MATCH_THRESHOLD_PRIMARY = 0.7;

/** Relleno de sugerencias cuando faltan resultados al umbral principal. */
export const MATCH_THRESHOLD_RELATED = 0.55;

const STOPWORDS_ES = new Set([
  "de",
  "la",
  "el",
  "y",
  "en",
  "un",
  "una",
  "unos",
  "unas",
  "los",
  "las",
  "del",
  "al",
  "por",
  "con",
  "sin",
  "para",
]);

export function normalizeInterestText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeNormalized(normalized: string): string[] {
  return normalized.split(/\s+/).filter(Boolean);
}

function significantTokensFromInterest(interestRaw: string): string[] {
  const n = normalizeInterestText(interestRaw);
  const tokens = tokenizeNormalized(n).filter((t) => t.length >= 2 && !STOPWORDS_ES.has(t));
  return tokens.length > 0 ? tokens : tokenizeNormalized(n).filter((t) => t.length >= 2);
}

/** Distancia de Levenshtein (una fila; strings cortos en título/descripción). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

export function normalizedLevenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

/** Jaro [0,1]; combina bien con typos en palabras medias. */
export function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (!len1 || !len2) return 0;
  const matchDistance = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
  const m1 = new Array<boolean>(len1).fill(false);
  const m2 = new Array<boolean>(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(len2, i + matchDistance + 1);
    for (let j = start; j < end; j++) {
      if (m2[j] || s1.charCodeAt(i) !== s2.charCodeAt(j)) continue;
      m1[i] = true;
      m2[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < len1; i++) {
    if (!m1[i]) continue;
    while (!m2[k]) k++;
    if (s1.charCodeAt(i) !== s2.charCodeAt(k)) transpositions++;
    k++;
  }
  transpositions /= 2;
  return (
    (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3
  );
}

export function jaroWinklerSimilarity(s1: string, s2: string): number {
  const j = jaroSimilarity(s1, s2);
  let pref = 0;
  const maxPref = Math.min(4, s1.length, s2.length);
  while (pref < maxPref && s1.charCodeAt(pref) === s2.charCodeAt(pref)) pref++;
  return j + pref * 0.1 * (1 - j);
}

/**
 * Similitud entre dos palabras ya normalizadas: typos (Levenshtein + Jaro-Winkler), plurales, subcadena.
 */
export function wordSimilarityNormalized(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && long.startsWith(short)) return 0.94;
  if (long.includes(short) && short.length >= 4) return 0.9;
  const lev = normalizedLevenshteinSimilarity(a, b);
  const jw = jaroWinklerSimilarity(a, b);
  return Math.max(lev, jw);
}

function bestWordMatch(token: string, hayWords: string[]): number {
  let best = 0;
  for (const w of hayWords) {
    best = Math.max(best, wordSimilarityNormalized(token, w));
  }
  return best;
}

/**
 * Puntuación [0,1]: una línea de la Tabla (ej. «pantalón», «pantalones de hombre») frente al ítem.
 * Varias palabras: todas deben tener al menos una palabra en la publicación por encima del umbral que se compare después.
 * Aquí devolvemos el mínimo de las mejores coincidencias por palabra (AND suave entre tokens significativos).
 */
export function scoreInterestPhraseAgainstItem(
  interestRaw: string,
  titulo: string,
  descripcion: string
): number {
  const hayNorm = normalizeInterestText(`${titulo} ${descripcion}`);
  const hayWords = tokenizeNormalized(hayNorm);
  if (!hayWords.length) return 0;

  const tokens = significantTokensFromInterest(interestRaw);
  if (!tokens.length) return 0;

  const perToken = tokens.map((t) => bestWordMatch(t, hayWords));
  return Math.min(...perToken);
}

/** Mejor score entre cualquier línea de la Tabla y el ítem. */
export function itemMaxTablaScore(
  terminosTabla: string[],
  titulo: string,
  descripcion: string
): number {
  let max = 0;
  for (const line of terminosTabla) {
    max = Math.max(max, scoreInterestPhraseAgainstItem(line, titulo, descripcion));
  }
  return max;
}

/** Cuántas líneas distintas de la Tabla alcanzan al menos `threshold` con este ítem. */
export function itemTablaHitCount(
  terminosTabla: string[],
  titulo: string,
  descripcion: string,
  threshold: number
): number {
  let n = 0;
  for (const line of terminosTabla) {
    if (scoreInterestPhraseAgainstItem(line, titulo, descripcion) >= threshold) n += 1;
  }
  return n;
}
