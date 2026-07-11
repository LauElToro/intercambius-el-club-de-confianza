import { describe, expect, it } from "vitest";
import {
  buildAceptacionTexto,
  buildPropuestaPagoMessage,
  buildRechazoTexto,
  encontrarPropuestaPendienteDelOtro,
  mensajeEsRechazoPropuesta,
  resumenMensajeParaPreview,
} from "@/lib/chat-propuesta";

const mk = (id: number, senderId: number, contenido: string) => ({
  id,
  senderId,
  contenido,
  createdAt: new Date(2026, 0, id).toISOString(),
});

describe("chat-propuesta", () => {
  it("detecta rechazo de propuesta", () => {
    expect(mensajeEsRechazoPropuesta(buildRechazoTexto())).toBe(true);
  });

  it("comprador propone y vendedor acepta: pendiente desaparece", () => {
    const msgs = [
      mk(1, 10, buildPropuestaPagoMessage(1000, 2000, null)),
      mk(2, 20, buildAceptacionTexto({ iox: 1000, pesos: 2000 })),
    ];
    expect(encontrarPropuestaPendienteDelOtro(msgs, 20)).toBeNull();
    expect(encontrarPropuestaPendienteDelOtro(msgs, 10)).toBeNull();
  });

  it("contrapropuesta del vendedor reemplaza propuesta del comprador", () => {
    const msgs = [
      mk(1, 10, buildPropuestaPagoMessage(1000, null, null)),
      mk(2, 20, buildPropuestaPagoMessage(2000, 1500, null)),
    ];
    const pendiente = encontrarPropuestaPendienteDelOtro(msgs, 10);
    expect(pendiente?.propuesta.iox).toBe(2000);
    expect(pendiente?.propuesta.pesos).toBe(1500);
  });

  it("rechazo oculta propuesta pendiente", () => {
    const msgs = [
      mk(1, 10, buildPropuestaPagoMessage(500, null, null)),
      mk(2, 20, buildRechazoTexto()),
    ];
    expect(encontrarPropuestaPendienteDelOtro(msgs, 20)).toBeNull();
  });

  it("resumenMensajeParaPreview formatea propuesta_pago JSON", () => {
    const json = buildPropuestaPagoMessage(20000, null, null);
    expect(resumenMensajeParaPreview(json)).toContain("20000 IOX");
    expect(resumenMensajeParaPreview(json)).not.toContain('"_t"');
  });

  it("propuesta con mensaje de texto intermedio sigue pendiente", () => {
    const msgs = [
      mk(1, 10, buildPropuestaPagoMessage(500, null, null)),
      mk(2, 10, "ok, dame un momento"),
      mk(3, 20, buildPropuestaPagoMessage(800, null, null)),
    ];
    expect(encontrarPropuestaPendienteDelOtro(msgs, 10)?.propuesta.iox).toBe(800);
  });
});
