import { describe, expect, it } from "vitest";
import {
  esCanjeMixto,
  esCanjeRegistrado,
  esCanjeServicios,
  esServicio,
  etiquetaCantidad,
  labelCanje,
  labelModoCompra,
  nombreItem,
  parseUnidadServicio,
  unidadCantidad,
  verboOperacion,
  descripcionRegistroOperacion,
} from "@/lib/publicacion";

describe("publicacion", () => {
  it("esServicio solo con rubro servicios", () => {
    expect(esServicio("servicios")).toBe(true);
    expect(esServicio("experiencias")).toBe(false);
    expect(esServicio("productos")).toBe(false);
  });

  it("nombreItem y verboOperacion", () => {
    expect(nombreItem("servicios")).toBe("servicio");
    expect(verboOperacion({ rubro: "servicios" })).toBe("contratar");
    expect(verboOperacion({ rubro: "productos" })).toBe("comprar");
    expect(verboOperacion({ rubro: "servicios", modo: "permuta" })).toBe("canjear");
  });

  it("parsea unidad de oferta de la ficha", () => {
    expect(parseUnidadServicio("Por hora")).toBe("hora");
    expect(parseUnidadServicio("Por sesión")).toBe("sesion");
    expect(parseUnidadServicio("Por trabajo")).toBe("trabajo");
  });

  it("unidadCantidad: sesión por defecto en servicios; unidades en productos", () => {
    expect(unidadCantidad({ rubro: "productos" }).plural).toBe("unidades");
    expect(unidadCantidad({ rubro: "servicios" }).plural).toBe("sesiones");
    expect(unidadCantidad({ rubro: "servicios", detalles: { unidadServicio: "Por hora" } }).singular).toBe(
      "hora"
    );
    expect(etiquetaCantidad(2, unidadCantidad({ rubro: "servicios" }))).toBe("2 sesiones");
  });

  it("detecta canje de servicios y mixto", () => {
    expect(esCanjeServicios("servicios", "servicios")).toBe(true);
    expect(esCanjeMixto("servicios", "productos")).toBe(true);
    expect(esCanjeMixto("productos", "productos")).toBe(false);
    expect(labelCanje("servicios", "servicios")).toBe("Canje de servicios");
    expect(labelCanje("servicios", "productos")).toBe("Canje producto ↔ servicio");
    expect(labelModoCompra("servicios")).toBe("Contratar");
  });

  it("descripcionRegistroOperacion", () => {
    expect(
      descripcionRegistroOperacion({
        modo: "permuta",
        tituloDestino: "Clases de inglés",
        tituloOfrecido: "Reparación de PC",
        rubroDestino: "servicios",
        rubroOfrecido: "servicios",
      })
    ).toBe("Canje de servicios: Reparación de PC ↔ Clases de inglés");
    expect(
      descripcionRegistroOperacion({
        modo: "compra",
        tituloDestino: "Limpieza",
        rubroDestino: "servicios",
        cantidad: 2,
        unidad: unidadCantidad({ rubro: "servicios" }),
      })
    ).toBe("Contratación: Limpieza (2 sesiones)");
  });

  it("esCanjeRegistrado usa modo, segundo ítem o descripción", () => {
    expect(esCanjeRegistrado({ modo: "permuta" })).toBe(true);
    expect(esCanjeRegistrado({ otroMarketItemId: 9 })).toBe(true);
    expect(esCanjeRegistrado({ descripcion: "Canje de servicios: A ↔ B" })).toBe(true);
    expect(esCanjeRegistrado({ modo: "compra", descripcion: "Contratación: Limpieza" })).toBe(false);
  });
});
