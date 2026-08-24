import { describe, expect, it } from "vitest";
import {
  buildAceptacionTexto,
  buildPropuestaPagoMessage,
  buildRechazoTexto,
  encontrarPropuestaPendienteDelOtro,
  itemIdDesdeCard,
  mensajeEsRechazoPropuesta,
  otroMarketItemIdDesdeIntercambio,
  parseIntercambioCards,
  parsePropuestaPagoJson,
  propuestaPagoToDisplayText,
  propuestaPagoToResumenCorto,
  resolverModoOperacion,
  resumenMensajeParaPreview,
  valorReferenciaOperacion,
} from "@/lib/chat-propuesta";
import { unidadCantidad } from "@/lib/publicacion";

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

  it("incluye cantidad y modo en la propuesta JSON", () => {
    const json = buildPropuestaPagoMessage(1000, null, null, 3, "compra");
    const parsed = parsePropuestaPagoJson(json);
    expect(parsed?.cantidad).toBe(3);
    expect(parsed?.modo).toBe("compra");
    expect(parsed?.iox).toBe(1000);
  });

  it("resumen corto siempre muestra unidades", () => {
    const p = parsePropuestaPagoJson(buildPropuestaPagoMessage(450, 134, 1, 2, "compra"))!;
    expect(propuestaPagoToResumenCorto(p, (n) => `${n} IOX`)).toContain("2 unidades");
  });

  it("valor referencia compra = precio producto; permuta = diferencia", () => {
    const msgs = [
      mk(
        1,
        10,
        JSON.stringify({
          _t: "intercambio",
          miProducto: { precio: 1000, url: "/producto/1" },
          tuProducto: { precio: 3000, url: "/producto/2" },
        })
      ),
    ];
    expect(
      valorReferenciaOperacion({ modo: "compra", precioMarketItem: 1000, mensajes: msgs })
    ).toBe(1000);
    expect(
      valorReferenciaOperacion({ modo: "permuta", precioMarketItem: 1000, mensajes: msgs })
    ).toBe(2000);
  });

  it("resumen corto usa sesiones cuando se pasa unidad de servicio", () => {
    const p = parsePropuestaPagoJson(buildPropuestaPagoMessage(450, null, null, 2, "compra"))!;
    const unidad = unidadCantidad({ rubro: "servicios", unidadServicio: "Por sesión" });
    expect(propuestaPagoToResumenCorto(p, (n) => `${n} IOX`, unidad)).toContain("2 sesiones");
  });

  it("copy de propuesta: contratar vs canje", () => {
    const compra = parsePropuestaPagoJson(buildPropuestaPagoMessage(100, null, null, 1, "compra"))!;
    expect(propuestaPagoToDisplayText(compra, { rubroDestino: "servicios" })).toContain("contratación");
    const permuta = parsePropuestaPagoJson(buildPropuestaPagoMessage(100, null, null, 1, "permuta"))!;
    expect(propuestaPagoToDisplayText(permuta)).toContain("canje");
  });

  it("parsea ids y unidadServicio del mensaje de intercambio", () => {
    const json = JSON.stringify({
      _t: "intercambio",
      miProducto: { id: 11, titulo: "Clases", rubro: "servicios", unidadServicio: "Por hora", url: "/producto/11" },
      tuProducto: { id: 22, titulo: "Limpieza", rubro: "servicios", url: "/producto/22" },
    });
    const parsed = parseIntercambioCards(json);
    expect(parsed?.miProducto.id).toBe(11);
    expect(itemIdDesdeCard(parsed!.tuProducto)).toBe(22);
    expect(otroMarketItemIdDesdeIntercambio(parsed!, 22)).toBe(11);
  });

  it("parsea intercambio con espacios en el JSON", () => {
    const pretty = `{ "_t": "intercambio", "miProducto": { "id": 1, "titulo": "A" }, "tuProducto": { "id": 2, "titulo": "B" } }`;
    expect(parseIntercambioCards(pretty)?.miProducto.id).toBe(1);
  });

  it("default permuta cuando hay cards de coincidencia", () => {
    const msgs = [
      mk(
        1,
        10,
        JSON.stringify({
          _t: "intercambio",
          miProducto: { precio: 1000, rubro: "servicios" },
          tuProducto: { precio: 3000, rubro: "servicios" },
        })
      ),
    ];
    expect(resolverModoOperacion({}, msgs)).toBe("permuta");
    expect(resolverModoOperacion({ modo: "compra" }, msgs)).toBe("compra");
  });
});
