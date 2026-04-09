import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { OfertaCreditoTerminos, hasRespondidoOfertaCredito } from "@/components/credito/OfertaCreditoTerminos";
import { useQueryClient } from "@tanstack/react-query";
import { CONTACT_EMAIL } from "@/lib/constants";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

const Layout = ({ children, showHeader = true }: LayoutProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showOfertaCredito, setShowOfertaCredito] = useState(false);

  useEffect(() => {
    if (user?.id && !hasRespondidoOfertaCredito(user.id)) {
      setShowOfertaCredito(true);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      <main className={cn(
        showHeader && "pt-16",
        showHeader && user?.id && "pb-mobile-nav md:pb-0"
      )}>
        {children}
        <footer
          className={cn(
            "border-t border-border/70 py-3 px-4 text-center text-xs text-muted-foreground bg-background/80",
            user?.id && showHeader && "pb-20 md:pb-3"
          )}
        >
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Quejas o sugerencias - Intercambius")}&body=${encodeURIComponent("Escribinos tu consulta, queja o sugerencia.\n\n")}`}
            className="text-gold hover:text-gold/90 hover:underline font-medium"
          >
            Contactanos
          </a>
          <span className="hidden sm:inline"> · </span>
          <span className="block sm:inline mt-0.5 sm:mt-0">Quejas y sugerencias por correo</span>
        </footer>
      </main>
      {showHeader && user?.id && <MobileBottomNav />}
      {user?.id && (
        <OfertaCreditoTerminos
          userId={user.id}
          open={showOfertaCredito}
          onClose={() => setShowOfertaCredito(false)}
          onAceptar={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
          onRechazar={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
        />
      )}
    </div>
  );
};

export default Layout;
