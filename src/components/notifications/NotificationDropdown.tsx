import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, ShoppingCart, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { notificacionesService, Notificacion } from "@/services/notificaciones.service";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof MessageCircle> = {
  mensaje: MessageCircle,
  compra: ShoppingCart,
  venta: ShoppingCart,
  apareciste_busquedas: Search,
  producto_mas_buscado: TrendingUp,
  nuevo_favorito: TrendingUp,
};

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["notificaciones", user?.id],
    queryFn: () => notificacionesService.getNotificaciones(15),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 min para que se actualicen más seguido
  });

  const marcarLeidaMutation = useMutation({
    mutationFn: (id: number) => notificacionesService.marcarLeida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  const marcarTodasMutation = useMutation({
    mutationFn: () => notificacionesService.marcarTodasLeidas(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  const noLeidas = data?.noLeidas ?? 0;
  const notificaciones = data?.notificaciones ?? [];

  const handleClick = (n: Notificacion) => {
    if (!n.leido) marcarLeidaMutation.mutate(n.id);
    const meta = (n.metadata || {}) as Record<string, number>;
    if (n.tipo === "mensaje" && meta.conversacionId) {
      navigate(`/chat/${meta.conversacionId}`);
    } else if (meta.marketItemId) {
      navigate(`/producto/${meta.marketItemId}`);
    } else if (n.tipo === "compra" || n.tipo === "venta") {
      navigate("/historial");
    } else {
      navigate("/market");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-primary">
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-2 border-b">
          <span className="font-semibold text-sm">Notificaciones</span>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => marcarTodasMutation.mutate()}
            >
              Marcar todas leídas
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No tenés notificaciones
          </div>
        ) : (
          notificaciones.map((n) => {
            const Icon = ICONS[n.tipo] ?? Bell;
            return (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex gap-3 py-3 cursor-pointer",
                  !n.leido && "bg-gold/5"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0 text-gold" />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    !n.leido && "font-semibold"
                  )}>
                    {n.titulo}
                  </p>
                  {n.mensaje && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {n.mensaje}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
