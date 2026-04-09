/** Límite de crédito negativo por defecto (en IOX). Quien llega al límite solo puede pagar por fuera de la página. */
export const CREDIT_LIMIT_DEFAULT = 50_000;

/** Crédito que se ofrece al ingresar al portal si acepta términos y condiciones. Queda como saldo negativo (-50k). */
export const CREDITO_OFERTA_INGRESO = 50_000;

/** Contacto para quejas y sugerencias (mailto en el sitio). */
export const CONTACT_EMAIL = "Intercambius.info@gmail.com";

/** Comisión mínima en IOX sobre cada intercambio (compra o venta), en porcentaje. Por defecto 5%. Los vendedores siempre aceptan 5% en IOX. */
export const COMISION_IOX_PORCENTAJE = 5;

/** Referencia de diseño: máximo de IOX acumulable en saldo positivo (ejemplo; políticas operativas pueden ajustar). */
export const SALDO_POSITIVO_MAX_IOX = 300_000;

/** Meses de deuda continua antes de activar proceso de regularización (referencia de documentación). */
export const MESES_REGULARIZACION_DEUDA = 6;
