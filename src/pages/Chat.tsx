import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { chatService, Conversacion, Mensaje } from "@/services/chat.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { IdentidadVerificadaBadge } from "@/components/kyc/IdentidadVerificadaBadge";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { getCreditoAceptado } from "@/components/credito/OfertaCreditoTerminos";
import { CREDIT_LIMIT_DEFAULT } from "@/lib/constants";
import { Send, MessageCircle, ArrowLeft, Loader2, ShoppingBag, HandCoins, Check, CheckCircle2, ExternalLink, X } from "lucide-react";
import {
  buildPropuestaPagoMessage,
  buildAceptacionTexto,
  buildRechazoTexto,
  contenidoParaMostrar,
  encontrarPropuestaPendienteDelOtro,
  encontrarPropuestaPendientePropia,
  propuestaPagoToResumenCorto,
  resumenMensajeParaPreview,
  minimoIoxRequerido,
  resolverPagadorId,
} from "@/lib/chat-propuesta";

const RUBROS_CHAT: Record<string, { label: string; icon: string }> = {
  servicios: { label: "Servicios", icon: "🔧" },
  productos: { label: "Productos", icon: "📦" },
  alimentos: { label: "Alimentos", icon: "🍎" },
  experiencias: { label: "Experiencias", icon: "🎭" },
};

function ProductoCardChat({
  titulo,
  descripcion,
  imagen,
  url,
  precio,
  rubro,
  formatIX,
  onNavigate,
}: {
  titulo: string;
  descripcion?: string;
  imagen?: string;
  url?: string;
  precio?: number;
  rubro?: string;
  formatIX: (n: number) => string;
  onNavigate: (path: string) => void;
}) {
  const id = url?.match(/\/producto\/(\d+)/)?.[1];
  const rubroInfo = rubro ? RUBROS_CHAT[rubro] : null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-gold/40 transition-colors">
      <button
        type="button"
        onClick={() => id && onNavigate(`/producto/${id}`)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/3] bg-muted">
          <img
            src={imagen || 'https://via.placeholder.com/300x200'}
            alt={titulo}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200'; }}
          />
          {rubroInfo && (
            <span className="absolute top-2 left-2 bg-background/95 backdrop-blur-sm text-foreground border border-border/50 rounded-full px-2 py-0.5 text-xs font-medium">
              {rubroInfo.icon} {rubroInfo.label}
            </span>
          )}
        </div>
        <div className="p-3">
          <h4 className="font-semibold text-sm line-clamp-2">{titulo}</h4>
          {descripcion && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{descripcion}</p>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-gold mt-2 hover:underline">
            <ExternalLink className="w-3 h-3" />
            Ver detalle
          </span>
          <div className="flex items-center justify-between mt-2">
            {precio != null && precio > 0 ? (
              <span className="text-base font-bold gold-text">{formatIX(precio)}</span>
            ) : (
              <span />
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

const Chat = () => {
  const { conversacionId } = useParams<{ conversacionId?: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatIX } = useCurrencyVariant();
  const [mensaje, setMensaje] = useState("");
  const [propuestaOpen, setPropuestaOpen] = useState(false);
  const [aprobarIntercambioOpen, setAprobarIntercambioOpen] = useState(false);
  const [codigoEmailInfo, setCodigoEmailInfo] = useState<{ para: string } | null>(null);
  const [montoIX, setMontoIX] = useState("");
  const [montoPesos, setMontoPesos] = useState("");
  const [montoUSD, setMontoUSD] = useState("");
  const [cantidadCompra, setCantidadCompra] = useState("1");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });
  const usuario = currentUser || user;

  const { data: conversaciones, isLoading: loadingLista } = useQuery({
    queryKey: ['chat'],
    queryFn: () => chatService.getConversaciones(),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const conversacionIdNum = Number(conversacionId);
  const conversacionIdOk =
    Boolean(conversacionId && String(conversacionId).trim() !== "") &&
    Number.isFinite(conversacionIdNum) &&
    conversacionIdNum > 0;

  const {
    data: chatDetalle,
    isLoading: loadingChat,
    isError: errorCargaChat,
    error: errorChatDetalle,
    refetch: refetchChatDetalle,
  } = useQuery({
    queryKey: ['chat', conversacionId],
    queryFn: () => chatService.getMensajes(conversacionIdNum),
    enabled: !!conversacionId && conversacionIdOk,
    refetchInterval: conversacionIdOk ? 4000 : false,
    refetchIntervalInBackground: false,
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return false;
      return failureCount < 5;
    },
    retryDelay: (i) => Math.min(600 * 2 ** i, 4000),
  });

  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (!chatDetalle?.mensajes || !conversacionIdOk) return;
    const count = chatDetalle.mensajes.length;
    if (count > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    }
    prevMsgCountRef.current = count;
  }, [chatDetalle?.mensajes, conversacionIdOk, queryClient]);

  useEffect(() => {
    if (!conversacionIdOk || !conversacionId) return;
    chatService.marcarConversacionLeida(conversacionIdNum).then(() => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
    }).catch(() => {});
  }, [conversacionId, conversacionIdOk, conversacionIdNum, queryClient]);

  const enviarMutation = useMutation({
    mutationFn: (contenido: string) => chatService.enviarMensaje(Number(conversacionId!), contenido),
    onSuccess: (nuevoMensaje) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: ['chat', conversacionId] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      setMensaje("");
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.data?.code === "KYC_REQUIRED") {
        toast({
          title: "Verificación requerida",
          description: e.message || "Debés verificar tu identidad para enviar esta propuesta.",
          variant: "destructive",
        });
        return;
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatDetalle?.mensajes]);

  const handleEnviar = () => {
    const text = mensaje.trim();
    if (!text || enviarMutation.isPending) return;
    enviarMutation.mutate(text);
  };

  const formatearHora = (d: string) => {
    const date = new Date(d);
    const hoy = new Date();
    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const etiquetaSeparadorFecha = (d: string) => {
    const date = new Date(d);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (date.toDateString() === hoy.toDateString()) return 'Hoy';
    if (date.toDateString() === ayer.toDateString()) return 'Ayer';
    if (date.getFullYear() !== hoy.getFullYear()) {
      return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
  };

  const truncar = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s;

  useEffect(() => {
    const st = location.state as { openPropuesta?: boolean } | null;
    if (st?.openPropuesta) {
      setPropuestaOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const codigoIntercambioMutation = useMutation({
    mutationFn: () => chatService.enviarCodigoIntercambio(Number(conversacionId!)),
    onSuccess: (data) => {
      setCodigoEmailInfo({ para: data.emailEnviadoA });
      setAprobarIntercambioOpen(false);
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: ['chat', conversacionId] });
      toast({ title: "Código enviado", description: data.mensaje });
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) {
        toast({
          title: "No se pudo enviar",
          description: e.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Error", description: "Intentá de nuevo", variant: "destructive" });
    },
  });

  const msgs = chatDetalle?.mensajes ?? [];
  // Detectar propuesta de intercambio: formato JSON con cards (un solo mensaje)
  const parseIntercambio = (c: string): { saludo: string; miProducto: { titulo: string; descripcion?: string; imagen?: string; url?: string; precio?: number; rubro?: string }; tuProducto: { titulo: string; descripcion?: string; imagen?: string; url?: string; precio?: number; rubro?: string } } | null => {
    try {
      if (c.startsWith(chatService.INTERCAMBIO_PREFIX)) {
        const parsed = JSON.parse(c);
        if (parsed._t === 'intercambio' && parsed.miProducto && parsed.tuProducto) return parsed;
      }
    } catch (_) {}
    return null;
  };
  const esPropuestaIntercambio = (c: string) =>
    parseIntercambio(c) !== null || (/quiero realizar un intercambio/i.test(c) && (/ver mi producto/i.test(c) || /imagen del producto/i.test(c)));
  const primerMensajeIntercambio = msgs.find((m) => esPropuestaIntercambio(m.contenido));
  const soyReceptor = !!primerMensajeIntercambio && primerMensajeIntercambio.senderId !== user?.id;

  const propuestaDelOtro =
    user?.id != null
      ? encontrarPropuestaPendienteDelOtro(msgs, user.id)
      : null;

  const propuestaPropiaPendiente =
    user?.id != null
      ? encontrarPropuestaPendientePropia(msgs, user.id)
      : null;

  const intercambioParseado = primerMensajeIntercambio
    ? parseIntercambio(primerMensajeIntercambio.contenido)
    : null;
  const miPrecioEnIntercambio = intercambioParseado
    ? (primerMensajeIntercambio!.senderId === user?.id
        ? intercambioParseado.miProducto.precio
        : intercambioParseado.tuProducto.precio)
    : undefined;
  const suPrecioEnIntercambio = intercambioParseado
    ? (primerMensajeIntercambio!.senderId === user?.id
        ? intercambioParseado.tuProducto.precio
        : intercambioParseado.miProducto.precio)
    : undefined;
  const diferenciaSugerida =
    miPrecioEnIntercambio != null && suPrecioEnIntercambio != null && suPrecioEnIntercambio > miPrecioEnIntercambio
      ? Math.floor(suPrecioEnIntercambio - miPrecioEnIntercambio)
      : null;
  const puedoOfrecerDiferencia =
    diferenciaSugerida != null &&
    diferenciaSugerida > 0 &&
    !propuestaPropiaPendiente &&
    !propuestaDelOtro;

  const puedeConfirmarRegistro = chatDetalle?.conversacion.puedeConfirmarRegistro ?? false;
  const necesitaReenvioCodigo = chatDetalle?.conversacion.necesitaReenvioCodigo ?? false;
  const codigoIntercambioEnviado = chatDetalle?.conversacion.codigoIntercambioEnviado ?? false;
  const registroCompletado = chatDetalle?.conversacion.registroCompletado ?? false;

  const hayMensajeCodigoEnviado = msgs.some((m) =>
    /código de verificación enviado por email/i.test(m.contenido)
  );
  const codigoYaEnviado = codigoIntercambioEnviado || !!codigoEmailInfo || hayMensajeCodigoEnviado;
  const mostrarAprobarIntercambio =
    soyReceptor &&
    !!primerMensajeIntercambio &&
    !codigoYaEnviado &&
    !registroCompletado &&
    !propuestaDelOtro &&
    !propuestaPropiaPendiente;

  const conv = chatDetalle?.conversacion;
  const valorReferenciaPropuesta = (() => {
    let ref = conv?.marketItem?.precio ?? 0;
    if (intercambioParseado) {
      const mi = Number(intercambioParseado.miProducto.precio ?? 0) || 0;
      const tu = Number(intercambioParseado.tuProducto.precio ?? 0) || 0;
      ref = Math.max(mi, tu, ref);
    }
    return ref;
  })();
  const minIoxPropuesta = minimoIoxRequerido(valorReferenciaPropuesta);

  const parseMontoCampo = (raw: string): number | null => {
    if (!raw.trim()) return null;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return null;
    return n;
  };

  const handleEnviarPropuesta = () => {
    const iox = parseMontoCampo(montoIX);
    const pesos = parseMontoCampo(montoPesos);
    const usd = parseMontoCampo(montoUSD);

    if (montoIX.trim() && iox === null) {
      toast({ title: "Montos inválidos", description: "IOX debe ser un número mayor o igual a 0.", variant: "destructive" });
      return;
    }
    if (montoPesos.trim() && pesos === null) {
      toast({ title: "Montos inválidos", description: "Pesos debe ser un número mayor o igual a 0.", variant: "destructive" });
      return;
    }
    if (montoUSD.trim() && usd === null) {
      toast({ title: "Montos inválidos", description: "USD debe ser un número mayor o igual a 0.", variant: "destructive" });
      return;
    }

    const tienePositivo = (iox ?? 0) > 0 || (pesos ?? 0) > 0 || (usd ?? 0) > 0;
    if (!tienePositivo) {
      toast({ title: "Propuesta vacía", description: "Completá al menos un monto mayor a 0.", variant: "destructive" });
      return;
    }

    const ioxEfectivo = iox ?? 0;
    const cantidad = Math.max(1, parseInt(cantidadCompra, 10) || 1);
    if (cantidadCompra.trim() && (Number.isNaN(cantidad) || cantidad < 1)) {
      toast({ title: "Cantidad inválida", description: "La cantidad debe ser al menos 1.", variant: "destructive" });
      return;
    }

    const valorConCantidad = valorReferenciaPropuesta * cantidad;
    if (minIoxPropuesta > 0 && ioxEfectivo < minimoIoxRequerido(valorConCantidad)) {
      toast({
        title: "Mínimo de IOX",
        description: `Toda operación debe incluir al menos 5% en IOX (mínimo ${formatIX(minimoIoxRequerido(valorConCantidad))} para ${cantidad > 1 ? `${cantidad} unidades` : "este intercambio"}).`,
        variant: "destructive",
      });
      return;
    }

    if (ioxEfectivo > 0 && user?.id && getCreditoAceptado(user.id) !== "aceptado") {
      toast({
        title: "Activá IOX primero",
        description: "Debés aceptar los términos de crédito IOX antes de proponer pagos en IOX.",
        variant: "destructive",
      });
      return;
    }

    if (ioxEfectivo > 0 && conv && user?.id) {
      const pagadorId = resolverPagadorId(conv.compradorId, conv.vendedorId, msgs, user.id);
      if (pagadorId === user.id) {
        const saldo = Number(usuario?.saldo ?? 0) || 0;
        const limite = Number(usuario?.limite ?? 0) || CREDIT_LIMIT_DEFAULT;
        if (saldo - ioxEfectivo < -limite) {
          toast({
            title: "Saldo insuficiente",
            description: `No tenés crédito disponible para proponer ${formatIX(ioxEfectivo)}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const payload = buildPropuestaPagoMessage(iox, pesos, usd, cantidad);
    enviarMutation.mutate(payload, {
      onSuccess: () => {
        setPropuestaOpen(false);
        setMontoIX("");
        setMontoPesos("");
        setMontoUSD("");
        setCantidadCompra("1");
      },
    });
  };

  const handleAceptarMonto = async () => {
    if (!propuestaDelOtro || !conversacionId) return;
    const { propuesta } = propuestaDelOtro;
    const texto = buildAceptacionTexto(propuesta);
    enviarMutation.mutate(texto, {
      onSuccess: async () => {
        try {
          const data = await chatService.enviarCodigoIntercambio(Number(conversacionId));
          toast({
            title: "Código enviado",
            description: `Se envió el código por email a quien paga la diferencia (${data.emailEnviadoA}). Solo esa persona puede confirmar el intercambio.`,
          });
          setCodigoEmailInfo({ para: data.emailEnviadoA });
        } catch (e) {
          const msg = e instanceof ApiError ? e.message : "No se pudo enviar el código por email";
          toast({ title: "Aviso", description: `${msg}. Podés reintentar desde el chat.`, variant: "destructive" });
        }
      },
    });
  };

  const handleRechazarPropuesta = () => {
    if (!propuestaDelOtro || enviarMutation.isPending) return;
    enviarMutation.mutate(buildRechazoTexto());
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-12rem)] min-h-[400px]">
          {/* Lista de conversaciones */}
          <Card className={`md:w-80 flex-shrink-0 ${!conversacionId ? 'md:block' : 'hidden md:block'}`}>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-gold" />
                Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[300px] md:max-h-[calc(100vh-18rem)]">
              {loadingLista ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                </div>
              ) : !conversaciones?.length ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Aún no tenés conversaciones. Para empezar: andá a{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/coincidencias")}
                    className="text-gold hover:underline font-medium"
                  >
                    Intercambius
                  </button>
                  {" "}o{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/market")}
                    className="text-gold hover:underline font-medium"
                  >
                    Market
                  </button>
                  , elegí algo que te interese y escribí una propuesta.
                </p>
              ) : (
                <div className="divide-y">
                  {conversaciones.map((c: Conversacion) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/chat/${c.id}`)}
                      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors ${
                        Number(conversacionId) === c.id ? 'bg-muted' : ''
                      } ${(c.mensajesNoLeidos ?? 0) > 0 && Number(conversacionId) !== c.id ? 'bg-blue-500/5' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gold/20 text-gold">
                            {c.otroUsuario.nombre?.slice(0, 2).toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        {(c.mensajesNoLeidos ?? 0) > 0 && Number(conversacionId) !== c.id && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                            {(c.mensajesNoLeidos ?? 0) > 9 ? "9+" : c.mensajesNoLeidos}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate flex items-center gap-1 min-w-0 ${(c.mensajesNoLeidos ?? 0) > 0 ? 'font-semibold' : 'font-medium'}`}>
                          <span className="truncate">{c.otroUsuario.nombre}</span>
                          {c.otroUsuario.kycVerificado && <IdentidadVerificadaBadge iconClassName="h-3.5 w-3.5 shrink-0" />}
                        </p>
                        {c.marketItem && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {c.marketItem.titulo}
                          </p>
                        )}
                        {c.ultimoMensaje && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {truncar(resumenMensajeParaPreview(c.ultimoMensaje.contenido), 40)}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hilo de chat */}
          <Card className="flex-1 flex flex-col min-w-0">
            {conversacionId ? (
              <>
                {!conversacionIdOk ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6">
                    <p className="text-center">El enlace del chat no es válido.</p>
                    <Button type="button" variant="outline" onClick={() => navigate("/chat")}>
                      Ir a mensajes
                    </Button>
                  </div>
                ) : loadingChat && !chatDetalle ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gold" />
                  </div>
                ) : chatDetalle ? (
                  <>
                    <CardHeader className="py-4 border-b flex flex-row items-center gap-3">
                      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/chat')}>
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gold/20 text-gold">
                          {chatDetalle.conversacion.otroUsuario.nombre?.slice(0, 2).toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{chatDetalle.conversacion.otroUsuario.nombre}</span>
                          {chatDetalle.conversacion.otroUsuario.kycVerificado && (
                            <IdentidadVerificadaBadge iconClassName="h-4 w-4 shrink-0" />
                          )}
                        </CardTitle>
                        {chatDetalle.conversacion.marketItem && (
                          <button
                            onClick={() => navigate(`/producto/${chatDetalle.conversacion.marketItem!.id}`)}
                            className="text-xs text-gold hover:underline truncate block text-left"
                          >
                            {chatDetalle.conversacion.marketItem.titulo}
                          </button>
                        )}
                      </div>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                      {(() => {
                        const mensajes = chatDetalle.mensajes;
                        let ultimaFecha: string | null = null;
                        return mensajes.map((m: Mensaje) => {
                          const fechaMsg = m.createdAt.split('T')[0];
                          const mostrarSeparador = ultimaFecha !== fechaMsg;
                          if (mostrarSeparador) ultimaFecha = fechaMsg;
                          return (
                            <div key={m.id}>
                              {mostrarSeparador && (
                                <div className="flex justify-center my-4">
                                  <span className="text-xs text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                                    {etiquetaSeparadorFecha(m.createdAt)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                                {(() => {
                                  const intercambio = parseIntercambio(m.contenido);
                                  if (intercambio) {
                                    return (
                                      <div className={`max-w-[85%] sm:max-w-md rounded-2xl overflow-hidden ${
                                        m.senderId === user?.id ? 'bg-gold/10 border border-gold/30' : 'bg-muted border border-border'
                                      }`}>
                                        <div className="p-4 space-y-4">
                                          <p className="text-sm font-medium">{intercambio.saludo}</p>
                                          <div>
                                            <p className="text-sm text-muted-foreground mb-2">Quiero intercambiar mi producto/servicio:</p>
                                            <ProductoCardChat
                                              titulo={intercambio.miProducto.titulo}
                                              descripcion={intercambio.miProducto.descripcion}
                                              imagen={intercambio.miProducto.imagen}
                                              url={intercambio.miProducto.url}
                                              precio={intercambio.miProducto.precio}
                                              rubro={intercambio.miProducto.rubro}
                                              formatIX={formatIX}
                                              onNavigate={navigate}
                                            />
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground mb-2">Por tu producto/servicio:</p>
                                            <ProductoCardChat
                                              titulo={intercambio.tuProducto.titulo}
                                              descripcion={intercambio.tuProducto.descripcion}
                                              imagen={intercambio.tuProducto.imagen}
                                              url={intercambio.tuProducto.url}
                                              precio={intercambio.tuProducto.precio}
                                              rubro={intercambio.tuProducto.rubro}
                                              formatIX={formatIX}
                                              onNavigate={navigate}
                                            />
                                          </div>
                                        </div>
                                        <p className={`text-xs px-4 pb-2 ${m.senderId === user?.id ? 'text-gold/80' : 'text-muted-foreground'}`}>
                                          {formatearHora(m.createdAt)}
                                        </p>
                                      </div>
                                    );
                                  }
                                  const textoPropuesta = contenidoParaMostrar(m.contenido);
                                  if (textoPropuesta) {
                                    return (
                                      <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                          m.senderId === user?.id ? 'bg-gold text-primary-foreground' : 'bg-muted'
                                        }`}
                                      >
                                        <p className="text-sm break-words whitespace-pre-wrap">{textoPropuesta}</p>
                                        <p className={`text-xs mt-1 ${m.senderId === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                          {formatearHora(m.createdAt)}
                                        </p>
                                      </div>
                                    );
                                  }
                                  const textoLegacy = resumenMensajeParaPreview(m.contenido);
                                  return (
                                    <div
                                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                        m.senderId === user?.id ? 'bg-gold text-primary-foreground' : 'bg-muted'
                                      }`}
                                    >
                                      <p className="text-sm break-words whitespace-pre-wrap">{textoLegacy}</p>
                                      <p className={`text-xs mt-1 ${m.senderId === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                        {formatearHora(m.createdAt)}
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        });
                      })()}
                      <div ref={messagesEndRef} />
                    </div>
                    {propuestaDelOtro && (
                      <div className="px-4 py-2 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          Te propusieron: {propuestaPagoToResumenCorto(propuestaDelOtro.propuesta, formatIX)}. Ambos deben aprobar.
                        </span>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRechazarPropuesta}
                            disabled={enviarMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPropuestaOpen(true)}
                            disabled={enviarMutation.isPending}
                          >
                            <HandCoins className="w-4 h-4 mr-1" />
                            Otra propuesta
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={handleAceptarMonto}
                            disabled={enviarMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceptar propuesta
                          </Button>
                        </div>
                      </div>
                    )}
                    {puedoOfrecerDiferencia && (
                      <div className="px-4 py-2 border-b border-border bg-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          Tu producto vale menos ({formatIX(miPrecioEnIntercambio ?? 0)} vs {formatIX(suPrecioEnIntercambio ?? 0)}).
                          Podés ofrecer la diferencia de <strong>{formatIX(diferenciaSugerida!)}</strong> en IOX (vos pagás la diferencia porque tu objeto vale menos).
                        </span>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => {
                            setMontoIX(String(diferenciaSugerida));
                            setMontoPesos("");
                            setMontoUSD("");
                            setPropuestaOpen(true);
                          }}
                        >
                          <HandCoins className="w-4 h-4 mr-1" />
                          Ofrecer diferencia
                        </Button>
                      </div>
                    )}
                    {propuestaPropiaPendiente && !propuestaDelOtro && (
                      <div className="px-4 py-2 border-b border-border bg-gold/5 text-sm text-muted-foreground">
                        Esperando respuesta a tu propuesta ({propuestaPagoToResumenCorto(propuestaPropiaPendiente.propuesta, formatIX)}).
                      </div>
                    )}
                    {necesitaReenvioCodigo && (
                      <div className="px-4 py-2 border-b border-border bg-amber-500/10 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm">
                          Hay un acuerdo aceptado pendiente de confirmar, pero falta el código por email.
                        </span>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => codigoIntercambioMutation.mutate()}
                          disabled={codigoIntercambioMutation.isPending}
                        >
                          Reenviar código
                        </Button>
                      </div>
                    )}
                    {puedeConfirmarRegistro && (
                      <div className="px-4 py-2 border-b border-border bg-green-500/10 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm">
                          Tenés un código por email para confirmar este intercambio.
                        </span>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() =>
                            navigate(`/registrar-intercambio?conversacionId=${conversacionId}`)
                          }
                        >
                          Confirmar intercambio
                        </Button>
                      </div>
                    )}
                    {mostrarAprobarIntercambio && (
                      <div className="px-4 py-2 border-b border-border bg-gold/10 flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          Te ofrecieron un intercambio. Si ya coordinaron, enviá el código: llega por <strong>email</strong> a quien paga la diferencia (no por el chat).
                        </span>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => setAprobarIntercambioOpen(true)}
                          disabled={enviarMutation.isPending || codigoIntercambioMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar intercambio
                        </Button>
                      </div>
                    )}
                    {codigoEmailInfo && (
                      <div className="px-4 py-2 border-b border-border bg-green-500/10 flex items-center justify-between gap-2">
                        <span className="text-sm">
                          Código enviado por <strong>email</strong> a quien paga ({codigoEmailInfo.para}). Solo esa persona debe revisar su casilla e ingresarlo en Registrar intercambio.
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCodigoEmailInfo(null)}>Cerrar</Button>
                      </div>
                    )}
                    <div className="p-4 border-t flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Escribí tu mensaje..."
                          value={mensaje}
                          onChange={(e) => setMensaje(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleEnviar())}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPropuestaOpen(true)}
                          title="Proponer pago (IOX, pesos o USD)"
                          disabled={!!propuestaPropiaPendiente}
                        >
                          <HandCoins className="w-4 h-4 mr-1" />
                          Propuesta
                        </Button>
                        <Button
                          variant="gold"
                          size="icon"
                          onClick={handleEnviar}
                          disabled={!mensaje.trim() || enviarMutation.isPending}
                        >
                          {enviarMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Usá «Propuesta» para ofrecer IOX, pesos y/o USD en un solo mensaje. Ambos deben aprobar el acuerdo.</p>
                    </div>
                    <Dialog open={propuestaOpen} onOpenChange={setPropuestaOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Propuesta de pago</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Completá uno o más montos (podés poner 0 en los que no uses). Si tu producto vale menos, ofrecé la diferencia en IOX.
                          {minIoxPropuesta > 0 && (
                            <> Mínimo de IOX: <strong>{formatIX(minIoxPropuesta)}</strong> (5% del valor).</>
                          )}
                        </p>
                        <div className="space-y-3">
                          <div className="flex gap-2 items-center">
                            <Label className="w-14 shrink-0">Cant.</Label>
                            <Input
                              type="number"
                              min={1}
                              placeholder="1"
                              value={cantidadCompra}
                              onChange={(e) => setCantidadCompra(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <Label className="w-14 shrink-0">IOX</Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={montoIX}
                              onChange={(e) => setMontoIX(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <Label className="w-14 shrink-0">$</Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={montoPesos}
                              onChange={(e) => setMontoPesos(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <Label className="w-14 shrink-0">USD</Label>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={montoUSD}
                              onChange={(e) => setMontoUSD(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPropuestaOpen(false)}>
                            Cancelar
                          </Button>
                          <Button
                            variant="gold"
                            onClick={handleEnviarPropuesta}
                            disabled={enviarMutation.isPending}
                          >
                            {enviarMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Enviar propuesta"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={aprobarIntercambioOpen} onOpenChange={setAprobarIntercambioOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprobar intercambio</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Se generará un código de 6 dígitos y se <strong>enviará por email</strong> a quien hizo la propuesta de intercambio. Esa persona debe ingresarlo en &quot;Registrar intercambio&quot;. El código <strong>no</strong> se publica en el chat.
                        </p>
                        <p className="text-sm rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-foreground">
                          Solo entregá este tipo de código cuando te encuentres con la otra parte y/o recibas el producto.
                        </p>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAprobarIntercambioOpen(false)}>Cancelar</Button>
                          <Button
                            variant="gold"
                            onClick={() => codigoIntercambioMutation.mutate()}
                            disabled={codigoIntercambioMutation.isPending}
                          >
                            {codigoIntercambioMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar código por email"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : errorCargaChat ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6">
                    <p className="text-center font-medium text-foreground">
                      No se pudo cargar esta conversación
                    </p>
                    {errorChatDetalle instanceof Error && (
                      <p className="text-sm text-center max-w-md">{errorChatDetalle.message}</p>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button type="button" variant="outline" onClick={() => refetchChatDetalle()}>
                        Reintentar
                      </Button>
                      <Button type="button" variant="gold" onClick={() => navigate("/chat")}>
                        Volver a mensajes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-6">
                    <p className="text-center">No se encontró la conversación.</p>
                    <Button type="button" variant="outline" onClick={() => navigate("/chat")}>
                      Ir a mensajes
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center text-muted-foreground">
                  Seleccioná una conversación de la lista o buscá productos en Intercambius / Market para contactar.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
