/**
 * Tamaño máximo por archivo al subir a Vercel Blob a través de la API (serverless).
 * El request body en Vercel no puede superar ~4,5 MB; dejamos margen.
 */
export const MAX_BLOB_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Límite de crédito negativo por defecto (en IOX). Quien llega al límite solo puede pagar por fuera de la página. */
export const CREDIT_LIMIT_DEFAULT = 50_000;

/** Crédito que se ofrece al ingresar al portal si acepta términos y condiciones. Queda como saldo negativo (-50k). */
export const CREDITO_OFERTA_INGRESO = 50_000;

/** Correo único de Intercambius (contacto, quejas, transaccional, formulario web). */
export const INTERCAMBIUS_EMAIL = "noreply@intercambius.com.ar";

export const CONTACT_EMAIL = INTERCAMBIUS_EMAIL;
export const COMPLAINTS_EMAIL = INTERCAMBIUS_EMAIL;

/** Parte del pago en IOX cuando el comprador tiene saldo IOX disponible (referencia 5%). Si no hay IOX del comprador, puede ser 100% dinero tradicional. */
export const COMISION_IOX_PORCENTAJE = 5;

/** Referencia de diseño: máximo de IOX acumulable en saldo positivo (ejemplo; políticas operativas pueden ajustar). */
export const SALDO_POSITIVO_MAX_IOX = 300_000;

/** Meses de deuda continua antes de activar proceso de regularización (referencia de documentación). */
export const MESES_REGULARIZACION_DEUDA = 6;
