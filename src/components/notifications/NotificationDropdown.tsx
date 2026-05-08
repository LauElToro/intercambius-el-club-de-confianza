import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, MessageCircle, ShoppingCart, TrendingUp, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { notificacionesService, Notificacion } from "@/services/notificaciones.service";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Notificacion | null>(null);

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

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => notificacionesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "No se pudo eliminar",
        description: "Probá de nuevo en unos segundos.",
      });
    },
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
    <>
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
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto p-0">
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
            const deleting =
              eliminarMutation.isPending && eliminarMutation.variables === n.id;
            return (
              <DropdownMenuGroup
                key={n.id}
                className={cn(
                  "flex w-full border-b border-border/60 last:border-b-0",
                  !n.leido && "bg-gold/5"
                )}
              >
                <DropdownMenuItem
                  className="min-h-[72px] flex-1 cursor-pointer gap-3 rounded-none py-3 pl-3 pr-1 focus:bg-accent"
                  onSelect={() => handleClick(n)}
                >
                  <Icon className="h-5 w-5 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        !n.leido && "font-semibold"
                      )}
                    >
                      {n.titulo}
                    </p>
                    {n.mensaje && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {n.mensaje}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="shrink-0 rounded-none px-2 py-3 text-muted-foreground hover:text-destructive focus:text-destructive"
                  disabled={deleting}
                  onSelect={() => setDeleteTarget(n)}
                  aria-label="Eliminar notificación"
                >
                  <Trash2 className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta notificación?</AlertDialogTitle>
          <AlertDialogDescription>
            Se va a borrar de tu lista y no vas a poder recuperarla. ¿Seguimos?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={eliminarMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={eliminarMutation.isPending || deleteTarget === null}
            onClick={() => {
              if (deleteTarget) eliminarMutation.mutate(deleteTarget.id);
            }}
          >
            {eliminarMutation.isPending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
