import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { OfertaCreditoTerminos, hasRespondidoOfertaCredito } from "@/components/credito/OfertaCreditoTerminos";
import { useQueryClient } from "@tanstack/react-query";
import { CONTACT_EMAIL } from "@/lib/constants";
import type { CategoriaContacto } from "@/services/contact.service";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import { ContactDialog } from "@/components/contact/ContactDialog";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

const Layout = ({ children, showHeader = true }: LayoutProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showOfertaCredito, setShowOfertaCredito] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactCategoria, setContactCategoria] = useState<CategoriaContacto>("consulta");

  const openContact = (categoria: CategoriaContacto = "consulta") => {
    setContactCategoria(categoria);
    setContactOpen(true);
  };

  const copyContactEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      toast({
        title: "Email copiado",
        description: "Si no tenés cliente de correo configurado, pegá la dirección en Gmail o tu app.",
      });
    } catch {
      toast({
        title: CONTACT_EMAIL,
        description: "Copiá manualmente esta dirección.",
      });
    }
  };

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
          <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openContact("consulta")}
                className="text-gold hover:text-gold/90 hover:underline font-medium underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
              >
                Contactanos
              </button>
              <button
                type="button"
                onClick={() => void copyContactEmail()}
                className="inline-flex items-center justify-center rounded-md p-1 text-gold hover:bg-gold/10 hover:text-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                aria-label="Copiar dirección de correo"
                title="Copiar email"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
            <span className="hidden sm:inline">·</span>
            <Link
              to="/economia"
              className="text-gold hover:text-gold/90 hover:underline font-medium"
            >
              Diseño económico
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link
              to="/terminos-generales"
              className="text-gold hover:text-gold/90 hover:underline font-medium"
            >
              Términos generales
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link
              to="/terminos"
              className="text-gold hover:text-gold/90 hover:underline font-medium"
            >
              Términos IOX
            </Link>
            <span className="hidden sm:inline">·</span>
            <button
              type="button"
              onClick={() => openContact("queja")}
              className="text-gold hover:text-gold/90 hover:underline font-medium underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
            >
              Quejas y sugerencias
            </button>
          </div>
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
      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultEmail={user?.email ?? null}
        defaultCategoria={contactCategoria}
      />
    </div>
  );
};

export default Layout;
