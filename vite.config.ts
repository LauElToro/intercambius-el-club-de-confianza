import { defineConfig, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
function mercadopagoDevApi(): Plugin {
  return {
    name: "mercadopago-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
        const url = (req.url ?? "").split("?")[0];
        if (!url.startsWith("/api/suscripcion")) return next();
        try {
          const mod = (await import("./server/mercadopago-suscripcion.mjs")) as {
            checkout: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
            estado: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
            webhook: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
          };
          if (req.method === "POST" && url === "/api/suscripcion/checkout") return await mod.checkout(req, res);
          if (req.method === "GET" && url === "/api/suscripcion/estado") return await mod.estado(req, res);
          if (url === "/api/suscripcion/webhook") return await mod.webhook(req, res);
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "No encontrado." }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mercadopagoDevApi(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
