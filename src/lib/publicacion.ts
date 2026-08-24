/** Clasificación y copy de publicaciones (producto vs servicio) en el flujo de intercambio. */

export type UnidadCantidad = "unidad" | "hora" | "sesion" | "trabajo";

export type UnidadEtiqueta = {
  clave: UnidadCantidad;
  singular: string;
  plural: string;
  por: string;
};

export type ModoOperacionCopy = "compra" | "permuta";

export const UNIDAD_SERVICIO_FICHA_OPTIONS = ["Por hora", "Por sesión", "Por trabajo"] as const;

const UNIDAD_GENERICA: UnidadEtiqueta = {
  clave: "unidad",
  singular: "unidad",
  plural: "unidades",
  por: "",
};

const UNIDAD_SERVICIO: Record<"hora" | "sesion" | "trabajo", UnidadEtiqueta> = {
  hora: { clave: "hora", singular: "hora", plural: "horas", por: "por hora" },
  sesion: { clave: "sesion", singular: "sesión", plural: "sesiones", por: "por sesión" },
  trabajo: { clave: "trabajo", singular: "trabajo", plural: "trabajos", por: "por trabajo" },
};

export function esServicio(rubro?: string | null): boolean {
  return rubro === "servicios";
}

export function nombreItem(
  rubro?: string | null
): "producto" | "servicio" | "alimento" | "experiencia" {
  if (rubro === "servicios") return "servicio";
  if (rubro === "alimentos") return "alimento";
  if (rubro === "experiencias") return "experiencia";
  return "producto";
}

export function nombreItemPlural(rubro?: string | null): string {
  const n = nombreItem(rubro);
  if (n === "servicio") return "servicios";
  if (n === "alimento") return "alimentos";
  if (n === "experiencia") return "experiencias";
  return "productos";
}

export function verboOperacion(params: {
  rubro?: string | null;
  modo?: ModoOperacionCopy;
}): "contratar" | "comprar" | "canjear" {
  if (params.modo === "permuta") return "canjear";
  if (esServicio(params.rubro)) return "contratar";
  return "comprar";
}

export function parseUnidadServicio(raw?: string | null): "hora" | "sesion" | "trabajo" | null {
  if (!raw) return null;
  const n = raw.trim().toLowerCase();
  if (n.includes("hora")) return "hora";
  if (n.includes("sesión") || n.includes("sesion")) return "sesion";
  if (n.includes("trabajo")) return "trabajo";
  return null;
}

export function unidadCantidad(item: {
  rubro?: string | null;
  detalles?: Record<string, string> | null;
  unidadServicio?: string | null;
}): UnidadEtiqueta {
  if (!esServicio(item.rubro)) return UNIDAD_GENERICA;
  const raw = item.unidadServicio ?? item.detalles?.unidadServicio ?? null;
  const parsed = parseUnidadServicio(raw);
  if (parsed) return UNIDAD_SERVICIO[parsed];
  return UNIDAD_SERVICIO.sesion;
}

export function etiquetaCantidad(n: number, unidad: UnidadEtiqueta = UNIDAD_GENERICA): string {
  const qty = Math.max(1, Math.floor(n) || 1);
  return `${qty} ${qty === 1 ? unidad.singular : unidad.plural}`;
}

export function labelCampoCantidad(unidad: UnidadEtiqueta): string {
  if (unidad.clave === "hora") return "Horas";
  if (unidad.clave === "sesion") return "Sesiones";
  if (unidad.clave === "trabajo") return "Cant.";
  return "Cant.";
}

export function esCanjeServicios(rubroA?: string | null, rubroB?: string | null): boolean {
  return esServicio(rubroA) && esServicio(rubroB);
}

export function esCanjeMixto(rubroA?: string | null, rubroB?: string | null): boolean {
  if (!rubroA || !rubroB) return false;
  return esServicio(rubroA) !== esServicio(rubroB);
}

export function labelCanje(rubroA?: string | null, rubroB?: string | null): string {
  if (esCanjeServicios(rubroA, rubroB)) return "Canje de servicios";
  if (esCanjeMixto(rubroA, rubroB)) return "Canje producto ↔ servicio";
  return "Permuta / canje";
}

export function labelModoCompra(rubroDestino?: string | null): string {
  return esServicio(rubroDestino) ? "Contratar" : "Compra";
}

export function labelsCardsCanje(
  miRubro?: string | null,
  tuRubro?: string | null
): { ofrezco: string; aCambio: string } {
  return {
    ofrezco: `Ofrezco mi ${nombreItem(miRubro)}:`,
    aCambio: `A cambio de tu ${nombreItem(tuRubro)}:`,
  };
}

export function descripcionRegistroOperacion(params: {
  modo: ModoOperacionCopy;
  tituloDestino: string;
  tituloOfrecido?: string | null;
  rubroDestino?: string | null;
  rubroOfrecido?: string | null;
  cantidad?: number;
  unidad?: UnidadEtiqueta;
}): string {
  const {
    modo,
    tituloDestino,
    tituloOfrecido,
    rubroDestino,
    rubroOfrecido,
    cantidad,
    unidad,
  } = params;
  if (modo === "permuta" && tituloOfrecido) {
    if (esCanjeServicios(rubroOfrecido, rubroDestino)) {
      return `Canje de servicios: ${tituloOfrecido} ↔ ${tituloDestino}`;
    }
    if (esCanjeMixto(rubroOfrecido, rubroDestino)) {
      return `Canje producto ↔ servicio: ${tituloOfrecido} ↔ ${tituloDestino}`;
    }
    return `Canje: ${tituloOfrecido} ↔ ${tituloDestino}`;
  }
  const qty =
    cantidad && cantidad > 1 && unidad ? ` (${etiquetaCantidad(cantidad, unidad)})` : "";
  if (esServicio(rubroDestino)) {
    return `Contratación: ${tituloDestino}${qty}`;
  }
  return `Compra: ${tituloDestino}${qty}`;
}

export function esCanjeRegistrado(i: {
  modo?: string | null;
  otroMarketItem?: unknown;
  otroMarketItemId?: number | null;
  descripcion?: string | null;
}): boolean {
  if (i.modo === "permuta") return true;
  if (i.otroMarketItem) return true;
  if (i.otroMarketItemId != null && i.otroMarketItemId > 0) return true;
  if (i.descripcion && /^Canje(\s|:)/i.test(i.descripcion.trim())) return true;
  return false;
}

export function unidadServicioDesdeDetalles(
  detalles?: Record<string, string> | null
): string | undefined {
  const v = detalles?.unidadServicio?.trim();
  return v || undefined;
}
