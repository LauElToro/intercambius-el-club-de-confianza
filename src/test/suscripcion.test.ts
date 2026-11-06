import { describe, expect, it } from "vitest";
import {
  evaluarFreemium,
  esVentaPura,
  grupoSuscripcion,
  KYC_USD,
  PLANES,
  suscripcionCubre,
} from "@/lib/suscripcion";

describe("suscripcion", () => {
  const ahora = new Date("2026-06-01T12:00:00.000Z");

  it("sigue en prueba con menos de 3 transacciones y menos de 3 meses", () => {
    const r = evaluarFreemium({
      miembroDesde: "2026-04-01T12:00:00.000Z",
      movimientos: [{ estado: "confirmado" }, { estado: "confirmado" }],
      ahora,
    });
    expect(r.activo).toBe(true);
    expect(r.motivo).toBe("vigente");
    expect(r.usadas).toBe(2);
  });

  it("corta la prueba al llegar a 3 transacciones, aunque no hayan pasado 3 meses", () => {
    const r = evaluarFreemium({
      miembroDesde: "2026-05-01T12:00:00.000Z",
      movimientos: [{ estado: "confirmado" }, { estado: "" }, { estado: "pendiente" }],
      ahora,
    });
    expect(r.activo).toBe(false);
    expect(r.motivo).toBe("transacciones");
  });

  it("no cuenta una transacción cancelada", () => {
    const r = evaluarFreemium({
      miembroDesde: "2026-05-20T12:00:00.000Z",
      movimientos: [
        { estado: "confirmado" },
        { estado: "cancelado" },
        { estado: "rechazada" },
      ],
      ahora,
    });
    expect(r.usadas).toBe(1);
    expect(r.activo).toBe(true);
  });

  it("corta la prueba a los 3 meses aunque no haya transacciones", () => {
    const r = evaluarFreemium({
      miembroDesde: "2026-03-01T12:00:00.000Z",
      movimientos: [],
      ahora,
    });
    expect(r.activo).toBe(false);
    expect(r.motivo).toBe("meses");
    expect(r.vence?.toISOString()).toBe("2026-06-01T12:00:00.000Z");
  });

  it("el acceso vitalicio no se corta por tiempo ni por uso", () => {
    const r = evaluarFreemium({
      miembroDesde: "2020-01-01T00:00:00.000Z",
      movimientos: [{ estado: "confirmado" }, { estado: "confirmado" }, { estado: "confirmado" }],
      ahora,
      accesoVitalicio: true,
    });
    expect(r.activo).toBe(true);
    expect(r.motivo).toBe("vitalicio");
  });

  it("una permuta o una compra no pasan al plan de venta", () => {
    const userId = 7;
    const movimientos = [
      {
        usuarioId: 7,
        otraPersonaId: 8,
        creditos: -100,
        estado: "confirmado",
        modo: "compra",
        descripcion: "Compra: mesa",
      },
      {
        usuarioId: 7,
        otraPersonaId: 9,
        creditos: 20,
        estado: "confirmado",
        modo: "permuta",
        descripcion: "Canje: silla",
      },
    ];
    expect(esVentaPura(movimientos[0], userId)).toBe(false);
    expect(grupoSuscripcion(movimientos, userId)).toBe("intercambio");
  });

  it("una venta pura pasa al plan de USD 5", () => {
    const venta = {
      usuarioId: 3,
      otraPersonaId: 7,
      creditos: -500,
      estado: "confirmado",
      modo: "compra",
      descripcion: "Compra: lámpara",
    };
    expect(esVentaPura(venta, 7)).toBe(true);
    expect(grupoSuscripcion([venta], 7)).toBe("vendedor");
  });

  it("el plan de trueque no cubre a quien vende; el anual incluye el KYC", () => {
    expect(suscripcionCubre("vendedor", ["intercambio_anual"])).toBe(false);
    expect(suscripcionCubre("vendedor", ["vendedor_mensual"])).toBe(true);
    expect(suscripcionCubre("intercambio", ["intercambio_mensual"])).toBe(true);
    expect(PLANES.intercambio_mensual.montoUsd).toBe(3);
    expect(PLANES.intercambio_anual.montoUsd).toBe(30);
    expect(PLANES.intercambio_anual.incluyeKyc).toBe(true);
    expect(PLANES.vendedor_mensual.montoUsd).toBe(5);
    expect(PLANES.vendedor_anual.montoUsd).toBe(45);
    expect(PLANES.vendedor_anual.incluyeKyc).toBe(true);
    expect(PLANES.vendedor_mensual.incluyeKyc).toBe(false);
    expect(KYC_USD).toBe(3);
  });
});
