/** Propuesta de pago unificada (IOX + pesos + USD en un solo mensaje JSON). */
export const PROPUESTA_PAGO_PREFIX = '{"_t":"propuesta_pago"';

export interface PropuestaPago {
  iox?: number;
  pesos?: number;
  usd?: number;
}

export interface MensajePropuesta {
  id: number;
  senderId: number;
  contenido: string;
  createdAt: string;
}

export function parsePropuestaPagoJson(contenido: string): PropuestaPago | null {
  const t = contenido.trim();
  if (!t.startsWith("{")) return null;
  try {
    const o = JSON.parse(t) as {
      _t?: string;
      iox?: number | null;
      pesos?: number | null;
      usd?: number | null;
    };
    if (o._t !== "propuesta_pago") return null;
    const propuesta: PropuestaPago = {};
    if (o.iox != null && o.iox > 0) propuesta.iox = Math.floor(o.iox);
    if (o.pesos != null && o.pesos > 0) propuesta.pesos = Math.floor(o.pesos);
    if (o.usd != null && o.usd > 0) propuesta.usd = Math.floor(o.usd);
    return propuesta.iox || propuesta.pesos || propuesta.usd ? propuesta : null;
  } catch {
    return null;
  }
}

export function parseLegacyPropuestaLinea(contenido: string): PropuestaPago | null {
  const propuesta: PropuestaPago = {};
  const ix = contenido.match(/propongo pagar (\d+)\s*(?:IX|IOX)/i);
  if (ix) propuesta.iox = parseInt(ix[1], 10);
  const pesos = contenido.match(/propongo pagar (\d+)\s*pesos/i);
  if (pesos) propuesta.pesos = parseInt(pesos[1], 10);
  const usd = contenido.match(/propongo pagar (\d+)\s*USD/i);
  if (usd) propuesta.usd = parseInt(usd[1], 10);
  return propuesta.iox || propuesta.pesos || propuesta.usd ? propuesta : null;
}

export function esMensajePropuestaPago(contenido: string): boolean {
  return parsePropuestaPagoJson(contenido) !== null || /propongo pagar/i.test(contenido);
}

export function buildPropuestaPagoMessage(iox: number | null, pesos: number | null, usd: number | null): string {
  const payload = {
    _t: "propuesta_pago",
    iox: iox && iox > 0 ? Math.floor(iox) : null,
    pesos: pesos && pesos > 0 ? Math.floor(pesos) : null,
    usd: usd && usd > 0 ? Math.floor(usd) : null,
  };
  return JSON.stringify(payload);
}

export function propuestaPagoToDisplayText(p: PropuestaPago): string {
  const parts: string[] = [];
  if (p.iox) parts.push(`${p.iox} IOX de diferencia`);
  if (p.pesos) parts.push(`${p.pesos} pesos (por fuera)`);
  if (p.usd) parts.push(`${p.usd} USD (por fuera)`);
  if (parts.length === 0) return "";
  return `Propongo cerrar el intercambio con: ${parts.join(", ")}. Ambos debemos aprobar el acuerdo.`;
}

export function propuestaPagoToResumenCorto(p: PropuestaPago, formatIX: (n: number) => string): string {
  const parts: string[] = [];
  if (p.iox) parts.push(formatIX(p.iox));
  if (p.pesos) parts.push(`$${p.pesos}`);
  if (p.usd) parts.push(`U$D ${p.usd}`);
  return parts.join(" + ");
}

export function mensajeEsAceptacionPropuesta(contenido: string): boolean {
  return /acepto la propuesta/i.test(contenido);
}

function mergePropuestas(a: PropuestaPago, b: PropuestaPago): PropuestaPago {
  return {
    ...(b.iox ? { iox: b.iox } : a.iox ? { iox: a.iox } : {}),
    ...(b.pesos ? { pesos: b.pesos } : a.pesos ? { pesos: a.pesos } : {}),
    ...(b.usd ? { usd: b.usd } : a.usd ? { usd: a.usd } : {}),
  };
}

/** Agrupa mensajes consecutivos de propuesta del mismo remitente (compat. con mensajes viejos separados). */
function mergePropuestasConsecutivas(
  mensajes: MensajePropuesta[],
  endIdx: number,
  senderId: number
): { propuesta: PropuestaPago; firstIdx: number } | null {
  let combined: PropuestaPago = {};
  let firstIdx = endIdx;
  for (let j = endIdx; j >= 0; j--) {
    const m = mensajes[j];
    if (m.senderId !== senderId) break;
    const json = parsePropuestaPagoJson(m.contenido);
    if (json) {
      combined = mergePropuestas(combined, json);
      firstIdx = j;
      continue;
    }
    if (/propongo pagar/i.test(m.contenido)) {
      const leg = parseLegacyPropuestaLinea(m.contenido);
      if (leg) {
        combined = mergePropuestas(combined, leg);
        firstIdx = j;
        continue;
      }
    }
    if (j === endIdx) break;
    break;
  }
  return combined.iox || combined.pesos || combined.usd ? { propuesta: combined, firstIdx } : null;
}

function hayAceptacionPosterior(mensajes: MensajePropuesta[], desdeIdx: number, proposerId: number): boolean {
  for (let k = desdeIdx + 1; k < mensajes.length; k++) {
    const m = mensajes[k];
    if (m.senderId === proposerId) continue;
    if (mensajeEsAceptacionPropuesta(m.contenido)) return true;
  }
  return false;
}

/** Propuesta del otro usuario que aún no fue aceptada. */
export function encontrarPropuestaPendienteDelOtro(
  mensajes: MensajePropuesta[],
  myUserId: number
): { propuesta: PropuestaPago; mensaje: MensajePropuesta } | null {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const m = mensajes[i];
    if (m.senderId === myUserId) continue;

    const merged = mergePropuestasConsecutivas(mensajes, i, m.senderId);
    if (!merged) break;

    if (hayAceptacionPosterior(mensajes, i, m.senderId)) return null;

    return { propuesta: merged.propuesta, mensaje: mensajes[merged.firstIdx] };
  }
  return null;
}

export function buildAceptacionTexto(p: PropuestaPago): string {
  const parts: string[] = [];
  if (p.iox) parts.push(`${p.iox} IOX`);
  if (p.pesos) parts.push(`${p.pesos} pesos (por fuera)`);
  if (p.usd) parts.push(`${p.usd} USD (por fuera)`);
  return `Acepto la propuesta: ${parts.join(" + ")}. ¡Ambos aprobamos el acuerdo!`;
}

export function contenidoParaMostrar(contenido: string): string | null {
  const firstLine = contenido.trim().split("\n")[0];
  const p = parsePropuestaPagoJson(firstLine);
  if (p) return propuestaPagoToDisplayText(p);
  return null;
}
