import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { OfertaCreditoTerminos, hasRespondidoOfertaCredito } from "@/components/credito/OfertaCreditoTerminos";
import { useQueryClient } from "@tanstack/react-query";

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
