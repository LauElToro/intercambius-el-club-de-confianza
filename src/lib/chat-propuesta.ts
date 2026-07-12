/** Propuesta de pago unificada (IOX + pesos + USD en un solo mensaje JSON). */
export const PROPUESTA_PAGO_PREFIX = '{"_t":"propuesta_pago"';

export interface PropuestaPago {
  iox?: number;
  pesos?: number;
  usd?: number;
  cantidad?: number;
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
      cantidad?: number | null;
    };
    if (o._t !== "propuesta_pago") return null;
    const propuesta: PropuestaPago = {};
    if (o.iox != null && o.iox > 0) propuesta.iox = Math.floor(o.iox);
    if (o.pesos != null && o.pesos > 0) propuesta.pesos = Math.floor(o.pesos);
    if (o.usd != null && o.usd > 0) propuesta.usd = Math.floor(o.usd);
    if (o.cantidad != null && o.cantidad > 0) propuesta.cantidad = Math.floor(o.cantidad);
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

export function buildPropuestaPagoMessage(
  iox: number | null,
  pesos: number | null,
  usd: number | null,
  cantidad: number = 1
): string {
  const qty = Math.max(1, Math.floor(cantidad) || 1);
  const payload = {
    _t: "propuesta_pago",
    iox: iox != null && iox >= 0 ? (iox > 0 ? Math.floor(iox) : 0) : null,
    pesos: pesos != null && pesos >= 0 ? (pesos > 0 ? Math.floor(pesos) : 0) : null,
    usd: usd != null && usd >= 0 ? (usd > 0 ? Math.floor(usd) : 0) : null,
    cantidad: qty,
  };
  return JSON.stringify(payload);
}

/** Mínimo IOX exigido (5 % del valor de referencia). */
export function minimoIoxRequerido(valorReferencia: number): number {
  if (valorReferencia <= 0) return 0;
  return Math.ceil((valorReferencia * 5) / 100);
}

export function tienePropuestaIntercambioEnHilo(mensajes: MensajePropuesta[]): boolean {
  return mensajes.some(
    (m) =>
      m.contenido.includes('"_t":"intercambio"') ||
      (/quiero realizar un intercambio/i.test(m.contenido) &&
        (/ver mi producto/i.test(m.contenido) || /imagen del producto/i.test(m.contenido)))
  );
}

function parseIntercambioPreciosPorRol(
  mensajes: MensajePropuesta[],
  compradorId: number
): { precioComprador: number; precioVendedor: number } | null {
  const msg = mensajes.find((m) => m.contenido.includes('"_t":"intercambio"'));
  if (!msg) return null;
  try {
    const p = JSON.parse(msg.contenido) as {
      _t?: string;
      miProducto?: { precio?: number };
      tuProducto?: { precio?: number };
    };
    if (p._t !== "intercambio" || !p.miProducto || !p.tuProducto) return null;
    const mi = Number(p.miProducto.precio ?? 0) || 0;
    const tu = Number(p.tuProducto.precio ?? 0) || 0;
    if (msg.senderId === compradorId) {
      return { precioComprador: mi, precioVendedor: tu };
    }
    return { precioComprador: tu, precioVendedor: mi };
  } catch {
    return null;
  }
}

/** Quién paga IOX al confirmar el acuerdo (alineado con backend). */
export function resolverPagadorId(
  compradorId: number,
  vendedorId: number,
  mensajes: MensajePropuesta[],
  proposerId: number
): number {
  if (!tienePropuestaIntercambioEnHilo(mensajes)) {
    return compradorId;
  }
  const precios = parseIntercambioPreciosPorRol(mensajes, compradorId);
  if (!precios) return proposerId;
  const proposerEsComprador = proposerId === compradorId;
  const precioProposer = proposerEsComprador ? precios.precioComprador : precios.precioVendedor;
  const precioOtro = proposerEsComprador ? precios.precioVendedor : precios.precioComprador;
  if (precioProposer < precioOtro) return proposerId;
  return proposerEsComprador ? vendedorId : compradorId;
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
  const qty = p.cantidad && p.cantidad > 1 ? p.cantidad : null;
  if (qty) parts.push(`${qty} u.`);
  if (p.iox) parts.push(formatIX(p.iox));
  if (p.pesos) parts.push(`$${p.pesos}`);
  if (p.usd) parts.push(`U$D ${p.usd}`);
  return parts.join(" + ");
}

export function mensajeEsAceptacionPropuesta(contenido: string): boolean {
  return /acepto la propuesta/i.test(contenido);
}

export function mensajeEsRechazoPropuesta(contenido: string): boolean {
  return /rechazo la propuesta/i.test(contenido);
}

export function buildRechazoTexto(): string {
  return "Rechazo la propuesta. Podemos seguir negociando con otra oferta.";
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

/** Propuesta propia que aún no fue aceptada ni rechazada por el otro. */
export function encontrarPropuestaPendientePropia(
  mensajes: MensajePropuesta[],
  myUserId: number
): { propuesta: PropuestaPago; mensaje: MensajePropuesta } | null {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const m = mensajes[i];
    if (m.senderId !== myUserId) continue;

    const merged = mergePropuestasConsecutivas(mensajes, i, m.senderId);
    if (!merged) continue;

    for (let k = i + 1; k < mensajes.length; k++) {
      const next = mensajes[k];
      if (next.senderId === myUserId) continue;
      if (mensajeEsAceptacionPropuesta(next.contenido)) return null;
      if (mensajeEsRechazoPropuesta(next.contenido)) return null;
      if (esMensajePropuestaPago(next.contenido)) return null;
    }

    return { propuesta: merged.propuesta, mensaje: mensajes[merged.firstIdx] };
  }
  return null;
}

function hayRespuestaPosteriorALaPropuesta(
  mensajes: MensajePropuesta[],
  desdeIdx: number,
  proposerId: number
): boolean {
  for (let k = desdeIdx + 1; k < mensajes.length; k++) {
    const m = mensajes[k];
    if (m.senderId === proposerId) continue;
    if (mensajeEsAceptacionPropuesta(m.contenido)) return true;
    if (mensajeEsRechazoPropuesta(m.contenido)) return true;
    if (esMensajePropuestaPago(m.contenido)) return true;
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
    if (!merged) continue;

    if (hayRespuestaPosteriorALaPropuesta(mensajes, i, m.senderId)) return null;

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
  const trimmed = contenido.trim();
  const json = parsePropuestaPagoJson(trimmed);
  if (json) return propuestaPagoToDisplayText(json);
  const legacy = parseLegacyPropuestaLinea(trimmed);
  if (legacy) return propuestaPagoToDisplayText(legacy);
  return null;
}

/** Texto corto para listas de chat, notificaciones y emails (nunca JSON crudo). */
export function resumenMensajeParaPreview(contenido: string): string {
  const display = contenidoParaMostrar(contenido);
  if (display) return display;
  const trimmed = contenido.trim();
  if (trimmed.startsWith('{"_t":"intercambio"')) return "Propuesta de intercambio";
  if (/quiero realizar un intercambio/i.test(contenido)) return "Propuesta de intercambio";
  if (mensajeEsAceptacionPropuesta(contenido)) return "Aceptó la propuesta de pago";
  if (mensajeEsRechazoPropuesta(contenido)) return "Rechazó la propuesta de pago";
  if (/código de verificación enviado por email/i.test(contenido)) {
    return "Código de verificación enviado por email";
  }
  return contenido.replace(/\*\*/g, "").split("\n")[0];
}
