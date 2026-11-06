import { esCanjeRegistrado } from "@/lib/publicacion";

/** Cupo de gratis de por vida. Si no se cumplen los requisitos, la plaza se consume. */
export const PIONEROS_CUPO = 500;

/** La prueba corta a los 3 meses o a las 3 transacciones, lo que ocurra primero. */
export const FREEMIUM_MESES = 3;
export const FREEMIUM_TRANSACCIONES = 3;

/** Pago único de identidad. El plan anual ya lo incluye. */
export const KYC_USD = 3;

export type GrupoSuscripcion = "intercambio" | "vendedor";
export type CicloSuscripcion = "mensual" | "anual";

export type CodigoPlan =
  | "intercambio_mensual"
  | "intercambio_anual"
  | "vendedor_mensual"
  | "vendedor_anual";

export type PlanSuscripcion = {
  codigo: CodigoPlan;
  grupo: GrupoSuscripcion;
  ciclo: CicloSuscripcion;
  montoUsd: number;
  frecuenciaMeses: number;
  incluyeKyc: boolean;
  titulo: string;
  resumen: string;
};

export const PLANES: Record<CodigoPlan, PlanSuscripcion> = {
  intercambio_mensual: {
    codigo: "intercambio_mensual",
    grupo: "intercambio",
    ciclo: "mensual",
    montoUsd: 3,
    frecuenciaMeses: 1,
    incluyeKyc: false,
    titulo: "Trueque, canje y compras",
    resumen: "Para quien solo hace trueque, canje, permuta o compra. El KYC se paga aparte.",
  },
  intercambio_anual: {
    codigo: "intercambio_anual",
    grupo: "intercambio",
    ciclo: "anual",
    montoUsd: 30,
    frecuenciaMeses: 12,
    incluyeKyc: true,
    titulo: "Trueque, canje y compras",
    resumen: "Mismo alcance, cobrado una vez al año. Incluye el KYC.",
  },
  vendedor_mensual: {
    codigo: "vendedor_mensual",
    grupo: "vendedor",
    ciclo: "mensual",
    montoUsd: 5,
    frecuenciaMeses: 1,
    incluyeKyc: false,
    titulo: "Con ventas",
    resumen: "Si además tenés operaciones que son solo de venta. El KYC se paga aparte.",
  },
  vendedor_anual: {
    codigo: "vendedor_anual",
    grupo: "vendedor",
    ciclo: "anual",
    montoUsd: 45,
    frecuenciaMeses: 12,
    incluyeKyc: true,
    titulo: "Con ventas",
    resumen: "Mismo alcance, cobrado una vez al año. Incluye el KYC.",
  },
};

const CANCELADAS = new Set([
  "cancelado",
  "cancelada",
  "rechazado",
  "rechazada",
  "anulado",
  "anulada",
  "fallido",
]);

export type MovimientoSuscripcion = {
  usuarioId: number;
  otraPersonaId: number;
  creditos: number;
  estado?: string | null;
  modo?: string | null;
  otroMarketItem?: unknown;
  otroMarketItemId?: number | null;
  descripcion?: string | null;
};

export function cuentaComoTransaccion(estado?: string | null): boolean {
  const e = (estado ?? "").trim().toLowerCase();
  if (!e) return true;
  return !CANCELADAS.has(e);
}

/** Venta pura: no es canje y los créditos entran para esta persona. */
export function esVentaPura(m: MovimientoSuscripcion, userId: number): boolean {
  if (!cuentaComoTransaccion(m.estado)) return false;
  if (esCanjeRegistrado(m)) return false;
  const creditos = Number(m.creditos) || 0;
  return (
    (Number(m.usuarioId) === Number(userId) && creditos > 0) ||
    (Number(m.otraPersonaId) === Number(userId) && creditos < 0)
  );
}

export function grupoSuscripcion(
  movimientos: MovimientoSuscripcion[],
  userId: number,
): GrupoSuscripcion {
  return movimientos.some((m) => esVentaPura(m, userId)) ? "vendedor" : "intercambio";
}

export function codigoPlan(grupo: GrupoSuscripcion, ciclo: CicloSuscripcion): CodigoPlan {
  return `${grupo}_${ciclo}` as CodigoPlan;
}

export function venceFreemium(miembroDesde?: string | null): Date | null {
  if (!miembroDesde) return null;
  const inicio = new Date(miembroDesde);
  if (Number.isNaN(inicio.getTime())) return null;
  const fin = new Date(inicio);
  fin.setMonth(fin.getMonth() + FREEMIUM_MESES);
  return fin;
}

export type MotivoFreemium = "vitalicio" | "vigente" | "meses" | "transacciones";

export function evaluarFreemium(input: {
  miembroDesde?: string | null;
  movimientos: { estado?: string | null }[];
  ahora?: Date;
  accesoVitalicio?: boolean;
}): {
  activo: boolean;
  motivo: MotivoFreemium;
  usadas: number;
  limite: number;
  vence: Date | null;
} {
  const ahora = input.ahora ?? new Date();
  const usadas = input.movimientos.filter((m) => cuentaComoTransaccion(m.estado)).length;
  const vence = venceFreemium(input.miembroDesde);
  const base = { usadas, limite: FREEMIUM_TRANSACCIONES, vence };
  if (input.accesoVitalicio) return { activo: true, motivo: "vitalicio", ...base };
  if (usadas >= FREEMIUM_TRANSACCIONES) return { activo: false, motivo: "transacciones", ...base };
  if (vence != null && ahora.getTime() >= vence.getTime()) return { activo: false, motivo: "meses", ...base };
  return { activo: true, motivo: "vigente", ...base };
}

export function suscripcionCubre(grupo: GrupoSuscripcion, planesAutorizados: string[]): boolean {
  return planesAutorizados.some((codigo) => {
    const plan = PLANES[codigo as CodigoPlan];
    if (!plan) return false;
    if (grupo === "vendedor") return plan.grupo === "vendedor";
    return true;
  });
}

export function kycCubierto(planesAutorizados: string[], kycPago: boolean): boolean {
  if (kycPago) return true;
  return planesAutorizados.some((codigo) => PLANES[codigo as CodigoPlan]?.incluyeKyc);
}
