import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  MessageCircle, 
  Heart, 
  Share2,
  CheckCircle2,
  Clock,
  User,
  Award,
  Loader2
} from "lucide-react";
import { marketService, MarketItem } from "@/services/market.service";

const ProductoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['marketItem', id],
    queryFn: () => marketService.getItemById(Number(id!)),
    enabled: !!id,
  });

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
            {/* Imagen principal */}
            <Card>
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <img
                  src={item.imagen}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
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
                      {item.precio && (
                        <span className="text-3xl font-bold gold-text">
                          {item.precio} IX
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
                <Button className="w-full bg-gold hover:bg-gold/90 text-primary-foreground" size="lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contactar vendedor
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Hacer una oferta
                </Button>
                <div className="text-xs text-center text-muted-foreground pt-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Publicado hace 2 días
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductoDetalle;
