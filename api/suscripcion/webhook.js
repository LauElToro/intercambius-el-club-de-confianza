import { webhook } from "../../server/mercadopago-suscripcion.mjs";

export default function handler(req, res) {
  return webhook(req, res);
}
