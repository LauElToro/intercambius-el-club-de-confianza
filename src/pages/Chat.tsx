import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { chatService, Conversacion, Mensaje } from "@/services/chat.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { Send, MessageCircle, ArrowLeft, Loader2, ShoppingBag, Banknote, Check } from "lucide-react";

const Chat = () => {
  const { conversacionId } = useParams<{ conversacionId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mensaje, setMensaje] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversaciones, isLoading: loadingLista } = useQuery({
    queryKey: ['chat'],
    queryFn: () => chatService.getConversaciones(),
  });

  const { data: chatDetalle, isLoading: loadingChat } = useQuery({
    queryKey: ['chat', conversacionId],
    queryFn: () => chatService.getMensajes(Number(conversacionId!)),
    enabled: !!conversacionId,
  });

  const enviarMutation = useMutation({
    mutationFn: (contenido: string) => chatService.enviarMensaje(Number(conversacionId!), contenido),
    onSuccess: (nuevoMensaje) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: ['chat', conversacionId] });
      setMensaje("");
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

  const truncar = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s;

  const { formatIX } = useCurrencyVariant();
  const [pagarIxOpen, setPagarIxOpen] = useState(false);
  const [montoIX, setMontoIX] = useState("");

  const propuestaDelOtro = (() => {
    const msgs = chatDetalle?.mensajes ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.senderId !== user?.id) {
        const match = m.contenido.match(/propongo pagar (\d+)\s*IX/i);
        if (match) return { monto: parseInt(match[1], 10), mensaje: m };
        break;
      }
    }
    return null;
  })();

  const handlePagarConIX = () => {
    const n = parseInt(montoIX, 10);
    if (isNaN(n) || n <= 0) return;
    const texto = `Propongo pagar ${n} IX de diferencia para cerrar el intercambio.`;
    enviarMutation.mutate(texto, {
      onSuccess: () => {
        setPagarIxOpen(false);
        setMontoIX("");
      },
    });
  };

  const handleAceptarMonto = () => {
    if (!propuestaDelOtro) return;
    const texto = `Acepto la propuesta de ${propuestaDelOtro.monto} IX. ¡Cerramos el intercambio!`;
    enviarMutation.mutate(texto);
    navigate("/registrar-intercambio", { state: { creditos: propuestaDelOtro.monto } });
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
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gold/20 text-gold">
                          {c.otroUsuario.nombre?.slice(0, 2).toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{c.otroUsuario.nombre}</p>
                        {c.marketItem && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {c.marketItem.titulo}
                          </p>
                        )}
                        {c.ultimoMensaje && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {truncar(c.ultimoMensaje.contenido, 40)}
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
                {loadingChat ? (
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
                        <CardTitle className="text-base truncate">{chatDetalle.conversacion.otroUsuario.nombre}</CardTitle>
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
                      {chatDetalle.mensajes.map((m: Mensaje) => {
                        const esMio = m.senderId === user?.id;
                        return (
                        <div
                          key={m.id}
                          className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              esMio ? 'bg-gold text-primary-foreground' : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm break-words">{m.contenido}</p>
                            <p className={`text-xs mt-1 ${esMio ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {formatearHora(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );})}
                      <div ref={messagesEndRef} />
                    </div>
                    {propuestaDelOtro && (
                      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          Te propusieron pagar {formatIX(propuestaDelOtro.monto)} de diferencia
                        </span>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={handleAceptarMonto}
                          disabled={enviarMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aceptar monto
                        </Button>
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
                          size="icon"
                          onClick={() => setPagarIxOpen(true)}
                          title="Pagar con IX"
                        >
                          <Banknote className="w-5 h-5" />
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
                      <p className="text-xs text-muted-foreground">Si hay diferencia de valor, podés proponer pagar con IX</p>
                    </div>
                    <Dialog open={pagarIxOpen} onOpenChange={setPagarIxOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pagar con IX</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                          Proponé un monto en IX para cubrir la diferencia del intercambio.
                        </p>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Ej: 50"
                            value={montoIX}
                            onChange={(e) => setMontoIX(e.target.value)}
                          />
                          <span className="text-sm font-medium">IX</span>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPagarIxOpen(false)}>
                            Cancelar
                          </Button>
                          <Button
                            variant="gold"
                            onClick={handlePagarConIX}
                            disabled={!montoIX || parseInt(montoIX, 10) <= 0 || enviarMutation.isPending}
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
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No se encontró la conversación.
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
