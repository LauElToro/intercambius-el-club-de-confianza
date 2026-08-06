import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Monta el mapa en un frame posterior y lo desmonta antes de que el padre
 * (p. ej. un Dialog/portal) destruya el DOM. Evita NotFoundError de removeChild
 * cuando Google Maps / Leaflet mutaron nodos que React intenta reconciliar.
 */
export function DeferredMapMount({
  height = 240,
  active = true,
  children,
}: {
  height?: number;
  active?: boolean;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }

    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
      setReady(false);
    };
  }, [active]);

  if (!ready) {
    return (
      <div
        className="rounded-lg border border-border bg-muted/30 flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
