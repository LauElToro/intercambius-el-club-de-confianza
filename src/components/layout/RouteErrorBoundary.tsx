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
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
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
