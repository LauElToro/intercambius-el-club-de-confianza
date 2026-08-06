import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  /** Se llama al capturar un error de render (p. ej. para marcar Google Maps no disponible). */
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  /** Evita montar el fallback en el mismo commit que desmonta Google Maps. */
  showFallback: boolean;
}

/** Evita que un fallo de Google Maps (p. ej. ApiNotActivatedMapError) tumbe toda la app. */
export class MapRenderErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, showFallback: false };
  private fallbackTimer: number | null = null;

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, showFallback: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[MapRenderErrorBoundary]', error.message, info.componentStack);
    this.props.onError?.(error);
    if (this.fallbackTimer != null) {
      window.clearTimeout(this.fallbackTimer);
    }
    this.fallbackTimer = window.setTimeout(() => {
      this.setState({ showFallback: true });
      this.fallbackTimer = null;
    }, 0);
  }

  componentWillUnmount(): void {
    if (this.fallbackTimer != null) {
      window.clearTimeout(this.fallbackTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      if (!this.state.showFallback) {
        return (
          <div
            className="rounded-lg border border-border bg-muted/30"
            style={{ minHeight: 120 }}
            aria-hidden
          />
        );
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}
