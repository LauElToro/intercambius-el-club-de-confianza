import { describe, expect, it } from "vitest";
import { nombrePublico, nombreTiendaEfectivo, nombreTiendaParaAsignar } from "@/lib/perfil";
import { isPublicAuthEndpoint, isPublicReadEndpoint } from "@/lib/auth-session";
import { prefetchChatDetalleYNavigate } from "@/lib/chat-navigation";

describe("e2e smoke — helpers críticos", () => {
  it("nombrePublico tolera usuario null/undefined", () => {
    expect(nombrePublico(null)).toBe("Usuario");
    expect(nombrePublico(undefined)).toBe("Usuario");
    expect(nombrePublico({ nombre: "Ana", nombreTienda: null })).toBe("Ana");
    expect(nombrePublico({ nombre: "Ana", nombreTienda: "Tienda Ana" })).toBe("Tienda Ana");
  });

  it("nombreTiendaEfectivo asigna fallback desde nombre", () => {
    expect(nombreTiendaEfectivo({ nombre: "Lautaro" })).toBe("Lautaro");
    expect(nombreTiendaParaAsignar({ nombre: "Lautaro" })).toBe("Lautaro");
    expect(nombreTiendaParaAsignar({ nombre: "Lautaro", nombreTienda: "Mi shop" })).toBeNull();
  });

  it("rutas públicas de lectura no invalidan sesión en perfiles", () => {
    expect(isPublicReadEndpoint("/api/users/u_84269b242f3a")).toBe(true);
    expect(isPublicReadEndpoint("/api/users/me")).toBe(false);
    expect(isPublicReadEndpoint("/api/market")).toBe(true);
    expect(isPublicAuthEndpoint("/api/auth/login")).toBe(true);
  });

  it("prefetchChatDetalleYNavigate está exportado", () => {
    expect(typeof prefetchChatDetalleYNavigate).toBe("function");
  });
});
