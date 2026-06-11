import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Heart, 
  Share2,
  CheckCircle2,
  Clock,
  User,
  Award,
  Loader2,
  CreditCard,
  MessageCircle
} from "lucide-react";
import { marketService, MarketItem } from "@/services/market.service";
import { favoritosService } from "@/services/favoritos.service";
import { checkoutService } from "@/services/checkout.service";
import { chatService } from "@/services/chat.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { useToast } from "@/components/ui/use-toast";
import { CREDIT_LIMIT_DEFAULT, COMISION_IOX_PORCENTAJE } from "@/lib/constants";
import { ApiError } from "@/lib/api";
import { prefetchChatDetalleYNavigate } from "@/lib/chat-navigation";
import { KycRequiredDialog } from "@/components/kyc/KycRequiredDialog";
import { IdentidadVerificadaBadge } from "@/components/kyc/IdentidadVerificadaBadge";
import { UnifiedMapView } from "@/components/map/UnifiedMapView";
import { resolveUbicacionToCoords } from "@/lib/ubicaciones";

const ProductoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [kycRequiredOpen, setKycRequiredOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const geoRequested = useRef(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const usuario = currentUser || user;
  const { formatIX } = useCurrencyVariant();

  useEffect(() => {
    if (geoRequested.current) return;
    geoRequested.current = true;

    const fromProfile = resolveUbicacionToCoords(usuario?.ubicacion);
    if (fromProfile) {
      setUserCoords({ lat: fromProfile.lat, lng: fromProfile.lng });
    }

    if (navigator.geolocation && window.isSecureContext) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      );
    }
  }, [usuario?.ubicacion]);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['marketItem', id, userCoords?.lat, userCoords?.lng],
    queryFn: () =>
      marketService.getItemById(Number(id!), {
        userLat: userCoords?.lat,
        userLng: userCoords?.lng,
      }),
    enabled: !!id,
  });

  const { data: isFav } = useQuery({
    queryKey: ['favorito', id],
    queryFn: () => favoritosService.isFavorito(Number(id!)),
    enabled: !!id && !!item,
  });

  const iniciarChatMutation = useMutation({
    mutationFn: () => chatService.iniciarConversacion({ marketItemId: Number(id!) }),
    onSuccess: async (data) => {
      await prefetchChatDetalleYNavigate(queryClient, navigate, data.conversacionId);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo iniciar la conversación", variant: "destructive" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutService.pay(Number(id!)),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['marketItem', id] });
      queryClient.invalidateQueries({ queryKey: ['intercambios'] });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      const precio = Number(item?.precio ?? 0) || 0;
      if (data.conversacionId && precio > 0) {
        try {
          await chatService.enviarMensaje(data.conversacionId, `Compré este producto por ${formatIX(precio)}.`);
          queryClient.invalidateQueries({ queryKey: ['chat', String(data.conversacionId)] });
        } catch {
          // no bloquear el flujo si falla el mensaje
        }
      }
      toast({ title: "¡Compra exitosa!", description: "Ya podés coordinar la entrega con el vendedor por chat." });
      setCheckoutOpen(false);
      if (data.conversacionId) {
        await prefetchChatDetalleYNavigate(queryClient, navigate, data.conversacionId);
      }
    },
    onError: (error: any) => {
      if (error instanceof ApiError && error.data?.code === "KYC_REQUIRED") {
        setCheckoutOpen(false);
        setKycRequiredOpen(true);
        return;
      }
      const msg = error?.data?.error || error?.message || "No se pudo completar el pago";
      const esLimite = /límite|limite|crédito|credito|insuficiente/i.test(String(msg));
      toast({
        title: esLimite ? "Límite de crédito" : "Error",
        description: esLimite ? "No tenés suficiente crédito disponible. El límite negativo es " + formatIX(limite) + "." : msg,
        variant: "destructive",
      });
    },
  });

  const toggleFavMutation = useMutation({
    mutationFn: () => favoritosService.toggleFavorito(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorito', id] });
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
    },
  });

  const medias = (item?.images && item.images.length > 0)
    ? item.images
    : (item?.imagen ? [{ url: item.imagen, mediaType: 'image' as const }] : []);

  const saldo = Number(usuario?.saldo ?? 0) || 0;
  const limite = Number(usuario?.limite ?? 0) || CREDIT_LIMIT_DEFAULT;
  const precio = Number(item?.precio ?? 0) || 0;
  const puedeGastar = saldo + limite;
  const enLimiteDeuda = limite > 0 && saldo <= -limite; // Límite de crédito alcanzado: solo pago por fuera
  const puedeComprar = !!item && !enLimiteDeuda && (saldo - precio >= -limite);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Button onClick={() => navigate("/market")}>
            Volver al Market
          </Button>
        </div>
      </Layout>
    );
  }

  const vendedor = item.vendedor;
  const hayStockPublico =
    item.rubro === "servicios" ? true : (item.stock ?? 0) > 0;
  const disponible = item.disponible !== false && hayStockPublico;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Botón volver */}
        <Button
          variant="ghost"
          onClick={() => navigate("/market")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal - Imagen y descripción */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galería */}
            <Card>
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                {medias.length > 0 ? (
                  medias[selectedMedia]?.mediaType === 'video' ? (
                    <video
                      src={medias[selectedMedia].url}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={medias[selectedMedia]?.url || item.imagen}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <img src={item.imagen} alt={item.titulo} className="w-full h-full object-cover" />
                )}
                {medias.length > 1 && (
                  <>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {medias.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedMedia(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === selectedMedia ? "bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => toggleFavMutation.mutate()}
                    >
                      <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </>
                )}
                {medias.length <= 1 && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => toggleFavMutation.mutate()}
                  >
                    <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                )}
              </div>
              {medias.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {medias.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedMedia(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                        i === selectedMedia ? "border-gold" : "border-transparent"
                      }`}
                    >
                      {m.mediaType === 'video' ? (
                        <video src={m.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Información del producto */}
            <Card>
              <CardHeader className="space-y-0">
                <div className="flex flex-col gap-3 lg:gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {item.rubro === "servicios" ? "🔧 Servicio" : 
                         item.rubro === "productos" ? "📦 Producto" :
                         item.rubro === "alimentos" ? "🍎 Alimento" : "🎭 Experiencia"}
                      </Badge>
                      {!disponible && (
                        <Badge variant="destructive">
                          {item.rubro !== "servicios" && item.stock === 0 ? "Agotado" : "No disponible"}
                        </Badge>
                      )}
                      {item.rubro !== "servicios" && item.stock != null && item.stock > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Stock: {item.stock}
                        </Badge>
                      )}
                      {item.precio != null && (
                        <span className="hidden text-3xl font-bold gold-text lg:inline">
                          {formatIX(item.precio)}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 touch-manipulation lg:h-10 lg:w-10"
                        aria-label="Favorito"
                        onClick={() => toggleFavMutation.mutate()}
                      >
                        <Heart className={`h-5 w-5 lg:h-4 lg:w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 touch-manipulation lg:h-10 lg:w-10"
                        aria-label="Compartir"
                        onClick={() => {
                          const url = typeof window !== "undefined" ? window.location.href : "";
                          if (url && navigator.share) {
                            navigator.share({ title: item.titulo, url }).catch(() => {});
                          } else if (url && navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(url);
                            toast({ title: "Enlace copiado" });
                          }
                        }}
                      >
                        <Share2 className="h-5 w-5 lg:h-4 lg:w-4" />
                      </Button>
                    </div>
                  </div>
                  {item.precio != null && (
                    <p className="text-3xl font-bold leading-tight gold-text lg:hidden">
                      {formatIX(item.precio)}
                    </p>
                  )}
                  <CardTitle className="text-2xl leading-snug">{item.titulo}</CardTitle>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{item.ubicacion}</span>
                    {item.distancia != null && Number.isFinite(Number(item.distancia)) && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span>{Number(item.distancia)} km de distancia</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {item.lat != null && item.lng != null && (
                  <UnifiedMapView
                    center={{ lat: item.lat, lng: item.lng }}
                    radiusKm={0}
                    height={220}
                    markers={[{ lat: item.lat, lng: item.lng, title: item.titulo }]}
                  />
                )}
                {/* Descripción */}
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {item.descripcion}
                  </p>
                </div>

                <Separator />

                {/* Características */}
                {item.caracteristicas && item.caracteristicas.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Características</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {item.caracteristicas.map((caracteristica, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                          <span>{caracteristica}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Medio de pago */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gold" />
                    Formas de intercambio
                  </h3>
                  <div className="bg-surface rounded-lg p-4 space-y-2">
                    {(() => {
                      const tipos = (item.tipoPago || "ix").split(",").map((s) => s.trim());
                      const aceptaIX = tipos.includes("ix") || tipos.includes("ix_pesos");
                      const aceptaPesos = tipos.includes("pesos") || tipos.includes("ix_pesos");
                      const aceptaUSD = tipos.includes("usd");
                      const aceptaConvenir = tipos.includes("convenir");
                      const etiquetas: string[] = [];
                      if (aceptaIX) etiquetas.push("Créditos IOX");
                      if (aceptaPesos) etiquetas.push("Pesos (por fuera)");
                      if (aceptaUSD) etiquetas.push("USD (por fuera)");
                      if (aceptaConvenir) etiquetas.push("A convenir");
                      return (
                        <>
                          <p className="font-medium">
                            {etiquetas.join(" • ")}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {aceptaIX && (
                              <>
                                Precio en IOX: <span className="font-semibold text-foreground">{formatIX(item.precio ?? 0)}</span>.
                                {aceptaPesos && " También acepta pesos por fuera."}
                                {!aceptaPesos && " Se transfieren al confirmar el intercambio."}
                              </>
                            )}
                            {!aceptaIX && (aceptaConvenir || aceptaPesos) && (
                              <>Acordarán el precio y forma de pago por chat o por fuera de la página.</>
                            )}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Separator />

                {/* Detalles específicos */}
                <div>
                  <h3 className="font-semibold mb-3">Detalles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(item.detalles).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <p className="font-medium text-foreground">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Vendedor y acciones */}
          <div className="space-y-6">
            {vendedor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publicado por</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-gold/20 text-gold">
                      {vendedor.avatar ?? vendedor.nombre?.slice(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{vendedor.nombre}</h3>
                      {vendedor.kycVerificado && <IdentidadVerificadaBadge iconClassName="h-5 w-5" />}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{vendedor.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({vendedor.totalResenas} reseñas)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>{vendedor.ubicacion}</span>
                    </div>
                    <Link to={`/perfil/${vendedor.id}`}>
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </div>

                <Separator />

                {/* Reputación */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Reputación</span>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-gold" />
                      <span className="font-semibold">{vendedor.rating}/5.0</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Miembro desde</span>
                      <span>{new Date(vendedor.miembroDesde).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total de reseñas</span>
                      <span>{vendedor.totalResenas}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Botones de acción */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                {usuario && vendedor && item.vendedorId !== usuario.id && (
                  <>
                    <Button
                      variant="gold-outline"
                      className="w-full"
                      size="lg"
                      onClick={() => iniciarChatMutation.mutate()}
                      disabled={iniciarChatMutation.isPending}
                    >
                      {iniciarChatMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <MessageCircle className="w-5 h-5 mr-2" />
                      )}
                      Contactar al vendedor
                    </Button>
                    {disponible && enLimiteDeuda && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium text-center py-2">
                        Llegaste al límite de crédito (-{formatIX(limite)}). Solo podés pagar por fuera de la página hasta que reduzcas tu deuda.
                      </p>
                    )}
                    {disponible && !enLimiteDeuda && (() => {
                      const tipos = (item.tipoPago || "ix").split(",").map((s) => s.trim());
                      const aceptaIX = tipos.includes("ix") || tipos.includes("ix_pesos");
                      return aceptaIX;
                    })() && (
                      <Button
                        className="w-full bg-gold hover:bg-gold/90 text-primary-foreground"
                        size="lg"
                        onClick={() => {
                          if (!usuario?.kycVerificado) {
                            setKycRequiredOpen(true);
                            return;
                          }
                          setCheckoutOpen(true);
                        }}
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {item.rubro === 'servicios' ? 'Contratar' : 'Comprar'}
                      </Button>
                    )}
                    {(() => {
                      const tipos = (item.tipoPago || "").split(",").map((s) => s.trim());
                      const soloConvenirPesos = (tipos.includes("convenir") || tipos.includes("pesos") || tipos.includes("usd")) && !tipos.includes("ix") && !tipos.includes("ix_pesos");
                      return soloConvenirPesos;
                    })() && (
                      <p className="text-sm text-muted-foreground text-center">
                        Contactá para acordar precio y forma de pago.
                      </p>
                    )}
                  </>
                )}
                {item.createdAt && (
                  <div className="text-xs text-center text-muted-foreground pt-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Publicado {new Date(item.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Checkout Dialog */}
        <KycRequiredDialog open={kycRequiredOpen} onOpenChange={setKycRequiredOpen} contexto="compra" />

        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pagar con IOX</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{item.titulo}</span>
                <span className="font-bold">{formatIX(precio)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Si tenés IOX disponible, una parte del pago ({COMISION_IOX_PORCENTAJE}%) puede realizarse en IOX; si no tenés IOX, el pago puede ser 100% en dinero tradicional. Sin comisiones fijas.
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tu saldo</span>
                  <span>{formatIX(saldo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Límite negativo</span>
                  <span>-{formatIX(limite)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Podés gastar hasta</span>
                  <span className="text-gold">{formatIX(puedeGastar)}</span>
                </div>
              </div>
              {!puedeComprar && (
                <p className="text-sm text-destructive">
                  No tenés suficiente crédito. Tu saldo ({formatIX(saldo)}) menos el precio ({formatIX(precio)}) superaría el límite negativo (-{formatIX(limite)}).
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="gold"
                onClick={() => checkoutMutation.mutate()}
                disabled={!puedeComprar || checkoutMutation.isPending}
                className="min-w-[140px]"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar pago"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProductoDetalle;
