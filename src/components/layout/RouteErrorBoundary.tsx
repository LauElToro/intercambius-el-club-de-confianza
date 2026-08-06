import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
  autoRecovering?: boolean;
}

const MAX_DOM_RECOVERIES = 2;

function isDomRemoveChildError(error: Error): boolean {
  const msg = error?.message ?? "";
  return (
    error?.name === "NotFoundError" ||
    /removeChild/i.test(msg) ||
    /nodo que se va a eliminar no es hijo/i.test(msg) ||
    /node to be removed is not a child/i.test(msg)
  );
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  private recoverTimer: number | null = null;
  private domRecoveries = 0;

  static getDerivedStateFromError(error: Error): State {
    // Errores de DOM por mapas/portales: recovery silencioso en lugar de pantalla permanente
    if (isDomRemoveChildError(error)) {
      return { hasError: true, autoRecovering: true, message: error.message };
    }
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);

    if (!isDomRemoveChildError(error)) return;

    this.domRecoveries += 1;
    if (this.domRecoveries > MAX_DOM_RECOVERIES) {
      this.setState({ autoRecovering: false });
      return;
    }

    if (this.recoverTimer != null) window.clearTimeout(this.recoverTimer);
    this.recoverTimer = window.setTimeout(() => {
      this.setState({ hasError: false, message: undefined, autoRecovering: false });
      this.recoverTimer = null;
      // Tras un rato sin fallos, permitir recuperar de nuevo
      window.setTimeout(() => {
        this.domRecoveries = Math.max(0, this.domRecoveries - 1);
      }, 5000);
    }, 50);
  }

  componentWillUnmount() {
    if (this.recoverTimer != null) window.clearTimeout(this.recoverTimer);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.state.autoRecovering) {
      return (
        <div className="min-h-[40vh] bg-background flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Reintentando…</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Algo salió mal al cargar esta página</h1>
          <p className="text-sm text-muted-foreground">
            {this.state.message || "Ocurrió un error inesperado. Podés volver al inicio e intentar de nuevo."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recargar
            </Button>
            <Button variant="gold" asChild>
              <Link to="/">Ir al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
