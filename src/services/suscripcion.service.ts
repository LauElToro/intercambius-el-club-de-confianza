import type { CodigoPlan } from "@/lib/suscripcion";

export type EstadoMercadoPago = {
  configurado: boolean;
  planesAutorizados: string[];
  kycPago: boolean;
};

export type CheckoutMercadoPago = {
  initPoint: string;
};

async function suscripcionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("intercambius_token");
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...init, headers });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "No se pudo conectar con Mercado Pago.");
  }
  return data as T;
}

export const suscripcionService = {
  estado(): Promise<EstadoMercadoPago> {
    return suscripcionFetch<EstadoMercadoPago>("/api/suscripcion/estado");
  },

  checkout(plan: CodigoPlan): Promise<CheckoutMercadoPago> {
    return suscripcionFetch<CheckoutMercadoPago>("/api/suscripcion/checkout", {
      method: "POST",
      body: JSON.stringify({ tipo: "suscripcion", plan }),
    });
  },

  pagarKyc(): Promise<CheckoutMercadoPago> {
    return suscripcionFetch<CheckoutMercadoPago>("/api/suscripcion/checkout", {
      method: "POST",
      body: JSON.stringify({ tipo: "kyc" }),
    });
  },
};
