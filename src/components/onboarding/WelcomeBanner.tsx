import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, ArrowRight, Package, Sparkles, MessageCircle } from "lucide-react";

const STORAGE_KEY = "intercambius_welcome_seen";

export const WelcomeBanner = ({
  isNewUser,
  onDismiss,
}: {
  isNewUser: boolean;
  onDismiss?: () => void;
}) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || !isNewUser) return null;

  const steps = [
    {
      icon: <Package className="w-5 h-5" />,
      title: "1. Creá tu producto o servicio",
      desc: "Contá qué ofrecés: clases, reparaciones, alimentos, lo que sea.",
      to: "/crear-producto",
      cta: "Crear publicación",
    },
    {
      icon: <ArrowRight className="w-5 h-5" />,
      title: "2. Buscá intercambios",
      desc: "En Coincidencias encontrás lo que otros ofrecen, con valor similar al tuyo.",
      to: "/coincidencias",
      cta: "Ver coincidencias",
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "3. Negociá por chat",
      desc: "Elegí algo, escribí tu propuesta y acordá con la otra persona.",
      to: "/coincidencias",
      cta: "Empezar",
    },
  ];

  return (
    <Card className="mb-8 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardContent className="relative pt-6 pb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">¿Primera vez acá?</h2>
              <p className="text-sm text-muted-foreground">
                Seguí estos pasos para empezar a intercambiar
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 p-4 rounded-xl bg-background/60 border border-border/50"
            >
              <div className="flex items-center gap-2 text-gold">{step.icon}</div>
              <h3 className="font-medium text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground flex-1">{step.desc}</p>
              <Link to={step.to}>
                <Button variant="outline" size="sm" className="w-full">
                  {step.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
