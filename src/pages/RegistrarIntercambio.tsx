import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle, Repeat, Loader2 } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { intercambiosService } from "@/services/intercambios.service";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type StateFromChat = {
  creditos?: number;
  tipoPago?: "pesos" | "usd";
  monto?: number;
  conversacionId?: number;
  requiereCodigo?: boolean;
};

const RegistrarIntercambio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateFromChat = (location.state ?? {}) as StateFromChat;
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requiereCodigo = !!stateFromChat.requiereCodigo && stateFromChat.conversacionId != null;
  const conversacionId = stateFromChat.conversacionId;
  const tipoPagoDesdeChat = stateFromChat.tipoPago;
  const montoDesdeChat = stateFromChat.monto;

  const [formData, setFormData] = useState({
    otraEmail: "",
    descripcion: "",
    creditos:
      !requiereCodigo && stateFromChat.creditos != null
        ? String(stateFromChat.creditos)
        : "",
    fecha: new Date().toISOString().split("T")[0],
    codigoVerificacion: "",
  });

  const codigoMutation = useMutation({
    mutationFn: () =>
      chatService.registroIntercambioConCodigo(conversacionId!, {
        codigo: formData.codigoVerificacion.replace(/\D/g, ""),
        descripcion: formData.descripcion.trim(),
        fecha: formData.fecha,
      }),
    onSuccess: async (data) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["intercambios"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      const desc =
        data.creditosAplicados > 0
          ? `Se aplicaron ${data.creditosAplicados} IOX según el acuerdo en el chat. Revisá tu saldo.`
          : "Quedó asentado el acuerdo (pago acordado por fuera; sin movimiento de IOX en la cuenta).";
      toast({ title: "Intercambio registrado", description: desc });
      navigate("/dashboard");
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) {
        toast({ title: "No se pudo registrar", description: e.message, variant: "destructive" });
        return;
      }
      toast({ title: "Error", description: "Intentá de nuevo", variant: "destructive" });
    },
  });

  const manualMutation = useMutation({
    mutationFn: () => {
      const raw = String(formData.creditos).trim();
      const c = raw === "" || raw === "-" ? 0 : parseInt(raw, 10);
      return intercambiosService.crearManual({
        otraEmail: formData.otraEmail.trim() || undefined,
        descripcion: formData.descripcion.trim(),
        creditos: c,
        fecha: formData.fecha,
      });
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["intercambios"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({
        title: "Intercambio registrado",
        description: "Tus saldos y el historial se actualizaron en la plataforma.",
      });
      navigate("/dashboard");
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) {
        toast({ title: "No se pudo registrar", description: e.message, variant: "destructive" });
        return;
      }
      toast({ title: "Error", description: "Intentá de nuevo", variant: "destructive" });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiereCodigo) {
      const digits = formData.codigoVerificacion.replace(/\D/g, "");
      if (digits.length !== 6) {
        toast({ title: "Código requerido", description: "Ingresá el código de 6 dígitos que te enviamos por email.", variant: "destructive" });
        return;
      }
      if (!formData.descripcion.trim()) {
        toast({ title: "Descripción requerida", description: "Contá qué intercambiaron.", variant: "destructive" });
        return;
      }
      codigoMutation.mutate();
    } else {
      if (!formData.otraEmail.trim()) {
        toast({ title: "Falta el email", description: "Ingresá el email registrado de la otra parte para vincular la cuenta.", variant: "destructive" });
        return;
      }
      if (!formData.descripcion.trim()) {
        toast({ title: "Descripción requerida", variant: "destructive" });
        return;
      }
      const rawCr = String(formData.creditos).trim();
      if (rawCr !== "" && rawCr !== "-") {
        const n = parseInt(rawCr, 10);
        if (Number.isNaN(n)) {
          toast({ title: "Créditos", description: "Ingresá un número entero o dejá en blanco / 0.", variant: "destructive" });
          return;
        }
      }
      manualMutation.mutate();
    }
  };

  const isPending = codigoMutation.isPending || manualMutation.isPending;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Repeat className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">
              {requiereCodigo ? "Confirmar intercambio" : "Registrar intercambio"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {requiereCodigo
              ? "Ingresá el código que te llegó por email (lo envió la otra parte desde el chat) y contá en pocas palabras qué concretaron."
              : "Anotá un intercambio con otra persona. Los IOX (positivo / negativo) actualizan ambos saldos en la plataforma."}
          </p>

          {requiereCodigo && !conversacionId && (
            <p className="text-sm text-destructive mb-4">
              Falta el identificador del chat. Volvé desde el hilo, aceptá la propuesta o usá &quot;Registrar
              intercambio&quot; con el enlace de la otra sección.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
              {!requiereCodigo && (
                <div className="space-y-2">
                  <Label htmlFor="otraEmail">Email de la otra parte *</Label>
                  <Input
                    id="otraEmail"
                    name="otraEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="mismo email con el que se registró en Intercambius"
                    value={formData.otraEmail}
                    onChange={handleChange}
                    required
                    className="bg-surface border-border focus:border-gold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lo usamos para ubicar a la contraparte y actualizar su saldo de forma vinculada a la tuya.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="descripcion">¿Qué intercambiaron? *</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  placeholder="Ej: Diferencia en IOX por trueque con lo acordado en el chat; entrega presencial de…"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold min-h-[100px]"
                />
              </div>

              {requiereCodigo && (
                <div className="space-y-2">
                  <Label htmlFor="codigoVerificacion">Código de verificación *</Label>
                  <Input
                    id="codigoVerificacion"
                    name="codigoVerificacion"
                    placeholder="6 dígitos (email)"
                    value={formData.codigoVerificacion}
                    onChange={handleChange}
                    maxLength={8}
                    inputMode="numeric"
                    className="bg-surface border-border focus:border-gold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Te lo envió quien aprobó en el chat. El monto en IOX o el acuerdo en pesos/USD se toma de los
                    mensajes aceptados en el hilo.
                  </p>
                </div>
              )}

              {!requiereCodigo && (
                <div className="space-y-2">
                  <Label htmlFor="creditos">Movimiento en IOX (desde tu cuenta)</Label>
                  <Input
                    id="creditos"
                    name="creditos"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formData.creditos}
                    onChange={handleChange}
                    className="bg-surface border-border focus:border-gold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Negativo si pagaste IOX, positivo si recibiste, 0 si solo dejás constancia o fuera de IOX.
                  </p>
                </div>
              )}

              {requiereCodigo && tipoPagoDesdeChat && montoDesdeChat != null && (
                <p className="text-sm text-muted-foreground">
                  Incluiste en el acuerdo un monto en{" "}
                  {tipoPagoDesdeChat === "pesos" ? "pesos" : "USD"}: {montoDesdeChat} (se registra al confirmar, sin
                  descontar IOX).
                </p>
              )}

              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full group"
              disabled={isPending || (requiereCodigo && !conversacionId)}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Confirmar intercambio
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {requiereCodigo
                ? "Solo con código válido y acuerdo visible en el chat se aplica en cuentas."
                : "El intercambio con email actualiza a ambas partes en un solo paso."}
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarIntercambio;
