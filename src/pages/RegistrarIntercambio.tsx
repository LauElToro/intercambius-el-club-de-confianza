import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, Loader2, MessageCircle, Receipt, Repeat } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { marketService } from "@/services/market.service";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import type { PropuestaPago } from "@/lib/chat-propuesta";
import {
  ladosDesdeIntercambio,
  otroMarketItemIdDesdeIntercambio,
  primerPayloadIntercambio,
  propuestaPagoToResumenCorto,
  resolverModoOperacion,
} from "@/lib/chat-propuesta";
import { descripcionRegistroOperacion, unidadCantidad } from "@/lib/publicacion";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";

type StateFromChat = {
  creditos?: number;
  tipoPago?: "pesos" | "usd";
  monto?: number;
  propuesta?: PropuestaPago;
  conversacionId?: number;
  requiereCodigo?: boolean;
};

const RegistrarIntercambio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateFromChat = (location.state ?? {}) as StateFromChat;
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatIX } = useCurrencyVariant();

  const conversacionIdFromQuery = parseInt(searchParams.get("conversacionId") ?? "", 10);
  const conversacionIdFromState = stateFromChat.conversacionId;
  const conversacionIdResolved = useMemo(() => {
    if (conversacionIdFromState != null && conversacionIdFromState > 0) return conversacionIdFromState;
    if (Number.isFinite(conversacionIdFromQuery) && conversacionIdFromQuery > 0) return conversacionIdFromQuery;
    return null;
  }, [conversacionIdFromState, conversacionIdFromQuery]);

  const { data: pendientes, isLoading: loadingPendientes } = useQuery({
    queryKey: ["chat", "registro-pendiente"],
    queryFn: () => chatService.getRegistroPendiente(),
  });

  const pendienteActual = useMemo(() => {
    if (!pendientes?.length) return null;
    if (conversacionIdResolved != null) {
      return pendientes.find((p) => p.conversacionId === conversacionIdResolved) ?? null;
    }
    return pendientes[0];
  }, [pendientes, conversacionIdResolved]);

  const necesitaConsultarChat =
    conversacionIdResolved != null &&
    !loadingPendientes &&
    pendientes != null &&
    !pendientes.some((p) => p.conversacionId === conversacionIdResolved);

  const { data: chatConsultado, isLoading: loadingChatConsultado } = useQuery({
    queryKey: ["chat", "registro-estado", conversacionIdResolved],
    queryFn: () => chatService.getMensajes(conversacionIdResolved!),
    enabled: necesitaConsultarChat,
  });

  const yaConfirmado = chatConsultado?.conversacion.registroCompletado === true;

  const conversacionId = pendienteActual?.conversacionId ?? null;
  const propuestaDesdeChat = pendienteActual?.propuesta ?? stateFromChat.propuesta;

  const { data: chatParaRegistro } = useQuery({
    queryKey: ["chat", conversacionId],
    queryFn: () => chatService.getMensajes(conversacionId!),
    enabled: conversacionId != null && conversacionId > 0,
  });

  const marketItemIdParaUnidad =
    pendienteActual?.marketItem?.id ?? chatParaRegistro?.conversacion.marketItem?.id ?? null;
  const { data: itemDestinoCompleto } = useQuery({
    queryKey: ["marketItem", marketItemIdParaUnidad],
    queryFn: () => marketService.getItemById(marketItemIdParaUnidad!),
    enabled:
      marketItemIdParaUnidad != null &&
      chatParaRegistro?.conversacion.marketItem?.rubro === "servicios",
  });

  const payloadIntercambio = primerPayloadIntercambio(chatParaRegistro?.mensajes ?? []);
  const marketItemIdConv =
    pendienteActual?.marketItem?.id ?? chatParaRegistro?.conversacion.marketItem?.id ?? null;
  const lados = payloadIntercambio
    ? ladosDesdeIntercambio(payloadIntercambio, marketItemIdConv)
    : null;
  const modoRegistro = resolverModoOperacion(propuestaDesdeChat, chatParaRegistro?.mensajes ?? []);
  const unidadDestino = unidadCantidad({
    rubro:
      lados?.destino.rubro ??
      chatParaRegistro?.conversacion.marketItem?.rubro ??
      itemDestinoCompleto?.rubro,
    detalles: itemDestinoCompleto?.detalles,
    unidadServicio: lados?.destino.unidadServicio,
  });
  const otroMarketItemId = payloadIntercambio
    ? otroMarketItemIdDesdeIntercambio(payloadIntercambio, marketItemIdConv)
    : null;

  const descripcionSugerida = useMemo(() => {
    const tituloDestino = lados?.destino.titulo ?? pendienteActual?.marketItem?.titulo;
    if (!tituloDestino) return "";
    return descripcionRegistroOperacion({
      modo: modoRegistro,
      tituloDestino,
      tituloOfrecido: lados?.ofrecido.titulo,
      rubroDestino: lados?.destino.rubro ?? chatParaRegistro?.conversacion.marketItem?.rubro,
      rubroOfrecido: lados?.ofrecido.rubro,
      cantidad: propuestaDesdeChat?.cantidad,
      unidad: unidadDestino,
    });
  }, [
    lados,
    modoRegistro,
    pendienteActual?.marketItem?.titulo,
    propuestaDesdeChat?.cantidad,
    unidadDestino,
    chatParaRegistro?.conversacion.marketItem?.rubro,
  ]);

  const [formData, setFormData] = useState({
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    codigoVerificacion: "",
  });
  const [descripcionEditada, setDescripcionEditada] = useState(false);

  useEffect(() => {
    if (descripcionEditada || !descripcionSugerida) return;
    setFormData((prev) =>
      prev.descripcion === descripcionSugerida ? prev : { ...prev, descripcion: descripcionSugerida }
    );
  }, [descripcionSugerida, descripcionEditada]);

  const codigoMutation = useMutation({
    mutationFn: () =>
      chatService.registroIntercambioConCodigo(conversacionId!, {
        codigo: formData.codigoVerificacion.replace(/\D/g, ""),
        descripcion: formData.descripcion.trim(),
        fecha: formData.fecha,
        ...(otroMarketItemId != null ? { otroMarketItemId } : {}),
      }),
    onSuccess: async (data) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["intercambios"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "registro-pendiente"] });
      const desc =
        data.creditosAplicados > 0
          ? `Se aplicaron ${data.creditosAplicados} IOX según el acuerdo en el chat. Revisá tu saldo.`
          : "Quedó asentado el acuerdo (pago acordado por fuera; sin movimiento de IOX en la cuenta).";
      toast({ title: "Intercambio registrado", description: desc });
      if (data.intercambioId) {
        navigate(`/evaluar/${data.intercambioId}`);
        return;
      }
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
    if (!conversacionId) {
      toast({
        title: "Sin intercambio pendiente",
        description: "Coordiná y aceptá una propuesta en el chat primero.",
        variant: "destructive",
      });
      return;
    }
    const digits = formData.codigoVerificacion.replace(/\D/g, "");
    if (digits.length !== 6) {
      toast({
        title: "Código requerido",
        description: "Ingresá el código de 6 dígitos que te enviamos por email.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.descripcion.trim()) {
      toast({ title: "Descripción requerida", description: "Contá qué intercambiaron.", variant: "destructive" });
      return;
    }
    codigoMutation.mutate();
  };

  const cargandoEstado =
    loadingPendientes || (necesitaConsultarChat && loadingChatConsultado);
  const sinPendiente = !cargandoEstado && !conversacionId && !yaConfirmado;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Repeat className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">Confirmar intercambio</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Ingresá el código de 6 dígitos que recibiste por email después de que la otra parte aceptó el acuerdo en
            el chat.
          </p>

          {cargandoEstado ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : yaConfirmado ? (
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium">Este intercambio ya fue confirmado</p>
              <p className="text-muted-foreground text-sm">
                Los IOX del acuerdo ya se aplicaron en las cuentas. No hace falta ingresar el código otra vez; si el
                saldo no se actualizaba, refrescá la página o volvé a iniciar sesión.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="gold" onClick={() => navigate("/historial")}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Ver historial
                </Button>
                <Button variant="outline" onClick={() => navigate("/chat")}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ir a mensajes
                </Button>
              </div>
            </div>
          ) : sinPendiente ? (
            <div className="bg-card rounded-2xl p-6 border border-border space-y-4 text-center">
              <p className="text-muted-foreground">
                No tenés un intercambio pendiente de confirmar. Primero acordá una propuesta en el chat y esperá el
                código por email.
              </p>
              <Button variant="gold" onClick={() => navigate("/chat")}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Ir a mensajes
              </Button>
            </div>
          ) : (
            <>
              {pendienteActual && (
                <p className="text-sm text-muted-foreground mb-4">
                  Con <strong>{pendienteActual.otroUsuario.nombre}</strong>
                  {pendienteActual.marketItem ? ` · ${pendienteActual.marketItem.titulo}` : ""}.
                </p>
              )}

              {pendientes && pendientes.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {pendientes.map((p) => (
                    <Button
                      key={p.conversacionId}
                      type="button"
                      size="sm"
                      variant={p.conversacionId === conversacionId ? "gold" : "outline"}
                      onClick={() => navigate(`/registrar-intercambio?conversacionId=${p.conversacionId}`)}
                    >
                      {p.otroUsuario.nombre}
                    </Button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">¿Qué intercambiaron? *</Label>
                    <Textarea
                      id="descripcion"
                      name="descripcion"
                      placeholder="Ej: Canje de servicios: clases de guitarra ↔ reparación de PC"
                      value={formData.descripcion}
                      onChange={(e) => {
                        setDescripcionEditada(true);
                        handleChange(e);
                      }}
                      required
                      className="bg-surface border-border focus:border-gold min-h-[100px]"
                    />
                  </div>

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
                      Te lo enviamos por email para este acuerdo en particular. Cada operación tiene su propio código de 6
                      dígitos. Solo quien paga la diferencia puede confirmar aquí.
                    </p>
                  </div>

                  {propuestaDesdeChat && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Acuerdo en el chat: {propuestaPagoToResumenCorto(propuestaDesdeChat, formatIX, unidadDestino)}.
                        {propuestaDesdeChat.iox
                          ? " Al confirmar se aplican los IOX acordados."
                          : " Sin movimiento de IOX en la cuenta (pago por fuera)."}
                      </p>
                      {conversacionId && (
                        <Button
                          type="button"
                          variant="gold"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => navigate(`/chat/${conversacionId}`)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Ver conversación
                        </Button>
                      )}
                    </>
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
                  disabled={codigoMutation.isPending || !conversacionId}
                >
                  {codigoMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Confirmar intercambio
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Solo con código válido y acuerdo visible en el chat se aplica en cuentas.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarIntercambio;
