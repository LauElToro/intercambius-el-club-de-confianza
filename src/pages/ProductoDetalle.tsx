import { useState } from "react";
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
  CreditCard
} from "lucide-react";
import { marketService, MarketItem } from "@/services/market.service";
import { favoritosService } from "@/services/favoritos.service";
import { checkoutService } from "@/services/checkout.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const ProductoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const usuario = currentUser || user;

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['marketItem', id],
    queryFn: () => marketService.getItemById(Number(id!)),
    enabled: !!id,
  });

  const { data: isFav } = useQuery({
    queryKey: ['favorito', id],
    queryFn: () => favoritosService.isFavorito(Number(id!)),
    enabled: !!id && !!item,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutService.pay(Number(id!)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['marketItem', id] });
      queryClient.invalidateQueries({ queryKey: ['intercambios'] });
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      toast({ title: "¡Compra exitosa!", description: "Ya podés coordinar la entrega con el vendedor por chat." });
      setCheckoutOpen(false);
      if (data.conversacionId) navigate(`/chat/${data.conversacionId}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo completar el pago", variant: "destructive" });
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

  const saldo = Number(usuario?.saldo) ?? 0;
  const limite = Number(usuario?.limite) ?? 150000;
  const precio = item?.precio ?? 0;
  const puedeGastar = saldo + limite;
  const puedeComprar = !!item && (saldo - precio >= -limite);

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
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {item.rubro === "servicios" ? "🔧 Servicio" : 
                         item.rubro === "productos" ? "📦 Producto" :
                         item.rubro === "alimentos" ? "🍎 Alimento" : "🎭 Experiencia"}
                      </Badge>
                      {item.precio != null && (
                        <span className="text-3xl font-bold gold-text">
                          {item.precio.toLocaleString('es-AR')} IX
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl mb-2">{item.titulo}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{item.ubicacion}</span>
                      <span>•</span>
                      <span>{item.distancia} km de distancia</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    Medio de pago
                  </h3>
                  <div className="bg-surface rounded-lg p-4 space-y-1">
                    <p className="font-medium">Créditos IX (tokens)</p>
                    <p className="text-muted-foreground text-sm">
                      Precio: <span className="font-semibold text-foreground">{item.precio?.toLocaleString('es-AR') ?? 0} IX</span>. 
                      Se transfieren al confirmar el intercambio.
                    </p>
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
                      {vendedor.verificado && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      )}
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
                  <Button
                    className="w-full bg-gold hover:bg-gold/90 text-primary-foreground"
                    size="lg"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {item.rubro === 'servicios' ? 'Contratar' : 'Comprar'}
                  </Button>
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
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pagar con IX</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{item.titulo}</span>
                <span className="font-bold">{precio.toLocaleString('es-AR')} IX</span>
              </div>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tu saldo</span>
                  <span>{saldo.toLocaleString('es-AR')} IX</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Límite negativo</span>
                  <span>-{limite.toLocaleString('es-AR')} IX</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Podés gastar hasta</span>
                  <span className="text-gold">{puedeGastar.toLocaleString('es-AR')} IX</span>
                </div>
              </div>
              {!puedeComprar && (
                <p className="text-sm text-destructive">
                  No tenés suficiente crédito. Tu saldo ({saldo.toLocaleString('es-AR')} IX) menos el precio ({precio.toLocaleString('es-AR')} IX) superaría el límite negativo (-{limite.toLocaleString('es-AR')} IX).
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
              >
                {checkoutMutation.isPending ? "Procesando..." : "Confirmar pago"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProductoDetalle;
