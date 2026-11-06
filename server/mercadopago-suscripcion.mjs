import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

/** Mantener iguales a src/lib/suscripcion.ts */
const PLANES = {
  intercambio_mensual: { grupo: "intercambio", monto: 3, frecuencia: 1, incluyeKyc: false, motivo: "Intercambius — trueque, canje y compras (mensual)" },
  intercambio_anual: { grupo: "intercambio", monto: 30, frecuencia: 12, incluyeKyc: true, motivo: "Intercambius — trueque, canje y compras (anual, incluye KYC)" },
  vendedor_mensual: { grupo: "vendedor", monto: 5, frecuencia: 1, incluyeKyc: false, motivo: "Intercambius — ventas (mensual)" },
  vendedor_anual: { grupo: "vendedor", monto: 45, frecuencia: 12, incluyeKyc: true, motivo: "Intercambius — ventas (anual, incluye KYC)" },
};

const KYC_USD = 3;
const MONEDA = process.env.MERCADOPAGO_CURRENCY || "USD";

const CANCELADAS = new Set([
  "cancelado",
  "cancelada",
  "rechazado",
  "rechazada",
  "anulado",
  "anulada",
  "fallido",
]);

let tokenCache = null;

function appUrl() {
  return (process.env.PUBLIC_APP_URL || "https://intercambius.com.ar").replace(/\/$/, "");
}

function apiBase() {
  return (process.env.API_URL || process.env.VITE_API_URL || "https://intercambios-backend.vercel.app").replace(
    /\/$/,
    "",
  );
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function mensajeMp(data) {
  if (Array.isArray(data?.cause) && data.cause[0]?.description) return String(data.cause[0].description);
  if (typeof data?.message === "string" && data.message && data.message !== "bad_request") return data.message;
  if (typeof data?.error === "string" && data.error && data.error !== "bad_request") return data.error;
  return "Mercado Pago rechazó la operación.";
}

function credencialesPresentes() {
  return Boolean(
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
      (process.env.MERCADOPAGO_CLIENT_ID && process.env.MERCADOPAGO_CLIENT_SECRET),
  );
}

async function accessToken() {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) return process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (tokenCache && tokenCache.until > Date.now()) return tokenCache.token;
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error(
      "Falta el Access Token de Mercado Pago en el servidor (MERCADOPAGO_ACCESS_TOKEN).",
    );
    err.status = 503;
    throw err;
  }
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const err = new Error(
      "Mercado Pago no aceptó el id y el secret de la aplicación. En el panel, copiá el Access Token de producción y cargalo como MERCADOPAGO_ACCESS_TOKEN.",
    );
    err.status = 503;
    throw err;
  }
  const expiresIn = Number(data.expires_in) || 3600;
  tokenCache = { token: data.access_token, until: Date.now() + Math.max(60, expiresIn - 120) * 1000 };
  return data.access_token;
}

async function mp(method, pathname, payload) {
  const token = await accessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (payload) {
    headers["Content-Type"] = "application/json";
    headers["X-Idempotency-Key"] = crypto.randomUUID();
  }
  const response = await fetch(`https://api.mercadopago.com${pathname}`, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(mensajeMp(data));
    err.status = 502;
    throw err;
  }
  return data;
}

function readBody(req) {
  if (req.body != null && req.body !== "") {
    if (typeof req.body === "string") {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch {
        return Promise.resolve({});
      }
    }
    if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function authorization(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || !String(header).toLowerCase().startsWith("bearer ")) return null;
  return String(header);
}

async function usuarioActual(req) {
  const header = authorization(req);
  if (!header) {
    const err = new Error("Tenés que iniciar sesión.");
    err.status = 401;
    throw err;
  }
  const response = await fetch(`${apiBase()}/api/users/me`, {
    headers: { Authorization: header, Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) {
    const err = new Error(data.error || data.message || "No pudimos validar tu sesión.");
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }
  return { user: data, header };
}

function cuentaComoTransaccion(estado) {
  const e = String(estado ?? "").trim().toLowerCase();
  if (!e) return true;
  return !CANCELADAS.has(e);
}

function esCanje(item) {
  if (item?.modo === "permuta") return true;
  if (item?.otroMarketItem) return true;
  if (item?.otroMarketItemId != null && Number(item.otroMarketItemId) > 0) return true;
  if (item?.descripcion && /^Canje(\s|:)/i.test(String(item.descripcion).trim())) return true;
  return false;
}

function esVentaPura(item, userId) {
  if (!cuentaComoTransaccion(item?.estado)) return false;
  if (esCanje(item)) return false;
  const creditos = Number(item?.creditos) || 0;
  const uid = Number(userId);
  return (Number(item?.usuarioId) === uid && creditos > 0) || (Number(item?.otraPersonaId) === uid && creditos < 0);
}

async function grupoDeUsuario(header, userId) {
  const response = await fetch(`${apiBase()}/api/intercambios/${userId}`, {
    headers: { Authorization: header, Accept: "application/json" },
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  const lista = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null;
  if (!lista) return null;
  return lista.some((item) => esVentaPura(item, userId)) ? "vendedor" : "intercambio";
}

function referenciaPlan(userId, plan) {
  return `ix-u-${userId}-${plan}`;
}

function referenciaKyc(userId) {
  return `ix-kyc-u-${userId}`;
}

function initPoint(data, token) {
  const test = String(token).startsWith("TEST-");
  return (test ? data.sandbox_init_point : data.init_point) || data.init_point || data.sandbox_init_point || null;
}

async function planesAutorizados(userId) {
  const activos = [];
  for (const codigo of Object.keys(PLANES)) {
    const data = await mp(
      "GET",
      `/preapproval/search?external_reference=${encodeURIComponent(referenciaPlan(userId, codigo))}`,
    );
    const results = Array.isArray(data.results) ? data.results : [];
    if (results.some((item) => item.status === "authorized")) activos.push(codigo);
  }
  return activos;
}

async function kycEstaPago(userId, planes) {
  if (planes.some((codigo) => PLANES[codigo]?.incluyeKyc)) return true;
  const data = await mp(
    "GET",
    `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(referenciaKyc(userId))}`,
  );
  const results = Array.isArray(data.results) ? data.results : [];
  return results.some((item) => item.status === "approved" || item.status === "accredited");
}

async function manejarError(res, error) {
  const status = error?.status || 500;
  send(res, status, { error: error instanceof Error ? error.message : "Error inesperado." });
}

export async function estado(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Método no permitido." });
  try {
    const { user } = await usuarioActual(req);
    if (!credencialesPresentes()) {
      return send(res, 200, { configurado: false, planesAutorizados: [], kycPago: false });
    }
    const planes = await planesAutorizados(user.id);
    const kycPago = await kycEstaPago(user.id, planes);
    return send(res, 200, { configurado: true, planesAutorizados: planes, kycPago });
  } catch (error) {
    return manejarError(res, error);
  }
}

export async function checkout(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Método no permitido." });
  try {
    const { user, header } = await usuarioActual(req);
    const body = await readBody(req);
    const tipo = body?.tipo === "kyc" ? "kyc" : "suscripcion";
    const token = await accessToken();
    const vuelta = `${appUrl()}/suscripcion?retorno=1`;

    if (tipo === "kyc") {
      const preference = await mp("POST", "/checkout/preferences", {
        items: [
          {
            title: "KYC Intercambius",
            description: "Verificación de identidad, pago único",
            quantity: 1,
            currency_id: MONEDA,
            unit_price: KYC_USD,
          },
        ],
        payer: { email: user.email, name: user.nombre },
        external_reference: referenciaKyc(user.id),
        back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
        auto_return: "approved",
        notification_url: `${appUrl()}/api/suscripcion/webhook`,
      });
      const url = initPoint(preference, token);
      if (!url) {
        const err = new Error("Mercado Pago no devolvió el link de pago.");
        err.status = 502;
        throw err;
      }
      return send(res, 200, { initPoint: url });
    }

    const codigo = String(body?.plan || "");
    const plan = PLANES[codigo];
    if (!plan) return send(res, 400, { error: "Ese plan no existe." });
    if (!user.email) return send(res, 400, { error: "Tu cuenta no tiene email para cobrar la suscripción." });

    const grupo = await grupoDeUsuario(header, user.id);
    if (grupo && plan.grupo !== grupo) {
      return send(res, 400, {
        error:
          grupo === "vendedor"
            ? "Como ya tuviste una venta, el plan que corresponde es el de USD 5 por mes o USD 45 al año."
            : "Todavía no registraste una venta. El plan que corresponde es el de USD 3 por mes o USD 30 al año.",
      });
    }

    const preapproval = await mp("POST", "/preapproval", {
      reason: plan.motivo,
      external_reference: referenciaPlan(user.id, codigo),
      payer_email: user.email,
      back_url: vuelta,
      status: "pending",
      auto_recurring: {
        frequency: plan.frecuencia,
        frequency_type: "months",
        transaction_amount: plan.monto,
        currency_id: MONEDA,
      },
    });
    const url = initPoint(preapproval, token);
    if (!url) {
      const err = new Error("Mercado Pago no devolvió el link de la suscripción.");
      err.status = 502;
      throw err;
    }
    return send(res, 200, { initPoint: url });
  } catch (error) {
    return manejarError(res, error);
  }
}

export async function webhook(req, res) {
  if (req.method !== "POST" && req.method !== "GET") return send(res, 405, { error: "Método no permitido." });
  return send(res, 200, { ok: true });
}
