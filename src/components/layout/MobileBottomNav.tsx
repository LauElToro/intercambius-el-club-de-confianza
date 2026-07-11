import { useNavigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { ShoppingBag, Users, MessageCircle, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationAlerts } from "@/hooks/use-notification-alerts";
import { useCoincidenciasAlert } from "@/hooks/use-coincidencias-alert";
import { isNavItemActive } from "@/lib/nav-link-active";

/** Barra de navegación inferior fija para mobile - acceso rápido a las 5 secciones principales */
export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = useMemo(() => {
    return [
      { to: "/market", label: "Market", icon: ShoppingBag },
      { to: "/coincidencias", label: "Coincidencias", icon: Users },
      { to: "/chat", label: "Mensajes", icon: MessageCircle },
      { to: "/favoritos", label: "Favoritos", icon: Heart },
      { to: "/dashboard", label: "Cuenta", icon: User },
    ] as const;
  }, []);

  const { noLeidas } = useNotificationAlerts();
  const { hayCoincidencias } = useCoincidenciasAlert();

  if (!user) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch justify-around h-16 max-w-xl mx-auto px-1 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(item.to, location.pathname, location.search);
          const isChat = item.to === "/chat";
          const isCoincidencias = item.to === "/coincidencias";

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
                {isCoincidencias && hayCoincidencias && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
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
