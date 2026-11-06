import { estado } from "../../server/mercadopago-suscripcion.mjs";

export default function handler(req, res) {
  return estado(req, res);
}
