import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Users, MessageCircle, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { notificacionesService } from "@/services/notificaciones.service";

const NAV_ITEMS = [
  { to: "/market", label: "Market", icon: ShoppingBag },
  { to: "/coincidencias", label: "Coincidencias", icon: Users },
  { to: "/chat", label: "Mensajes", icon: MessageCircle },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/dashboard", label: "Cuenta", icon: User },
] as const;

/** Barra de navegación inferior fija para mobile - acceso rápido a las 5 secciones principales */
export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["notificaciones", user?.id],
    queryFn: () => notificacionesService.getNotificaciones(5),
    enabled: !!user?.id,
  });
  const noLeidas = data?.noLeidas ?? 0;

  if (!user) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));
          const isChat = item.to === "/chat";

          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 h-full py-2 px-1 rounded-lg transition-colors touch-manipulation",
                "min-h-[44px] active:scale-95",
                isActive
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                <Icon
                  className={cn(
                    "w-6 h-6 transition-transform",
                    isActive && "drop-shadow-[0_0_8px_hsl(var(--gold)/0.5)]"
                  )}
                />
                {isChat && noLeidas > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-primary-foreground">
                    {noLeidas > 9 ? "9+" : noLeidas}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium truncate max-w-full",
                  isActive && "text-gold"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
