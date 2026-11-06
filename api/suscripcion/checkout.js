import { checkout } from "../../server/mercadopago-suscripcion.mjs";

export default function handler(req, res) {
  return checkout(req, res);
}
