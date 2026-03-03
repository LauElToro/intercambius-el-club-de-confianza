import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "intercambius_guia_coincidencias_seen";

export const GuiaCoincidencias = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setDismissed(true);
  };

  const pasos = [
    "Elegí tu producto o servicio",
    "Buscá lo que te interesa",
    "Hacé clic en Intercambiar para proponer",
  ];

  return (
    <Card className="mb-6 border-gold/20 bg-muted/30">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {pasos.map((texto, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold text-sm font-medium">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{texto}</span>
                {i < pasos.length - 1 && (
                  <span className="hidden sm:inline text-muted-foreground/50">→</span>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground"
            onClick={handleDismiss}
            aria-label="Cerrar guía"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
