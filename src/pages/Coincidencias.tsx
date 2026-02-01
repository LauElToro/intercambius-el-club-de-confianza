import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, MapPin, MessageCircle, Heart, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { coincidenciasService } from "@/services/coincidencias.service";
import { MarketItem } from "@/services/market.service";

const RUBROS = {
  servicios: { label: "Servicios", icon: "🔧" },
  productos: { label: "Productos", icon: "📦" },
  alimentos: { label: "Alimentos", icon: "🍎" },
  experiencias: { label: "Experiencias", icon: "🎭" }
};

const Coincidencias = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<number[]>([]);

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;

  const { data: coincidencias = [], isLoading, error } = useQuery({
    queryKey: ['coincidencias', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) {
        throw new Error('Usuario no autenticado');
      }
      return coincidenciasService.getCoincidencias(currentUser.id);
    },
    enabled: !!currentUser?.id,
  });

  const toggleFavorito = (id: number) => {
    setFavoritos(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </Layout>
    );
  }

  const saldo = Number(currentUser?.saldo ?? 0) || 0;
  const limite = Number(currentUser?.limite ?? 0) || 150000;
  const puedeComprar = saldo > -limite;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Mis coincidencias
            </h1>
          </div>
          <p className="text-muted-foreground">
            Productos y servicios con valor similar a tus publicaciones
          </p>
        </div>

        {/* Alerta de crédito */}
        {!puedeComprar && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el límite de crédito negativo ({limite.toLocaleString('es-AR')} IX). 
              Necesitás generar créditos positivos para continuar intercambiando.
            </AlertDescription>
          </Alert>
        )}

        {/* Info de crédito disponible */}
        <div className="bg-card rounded-lg p-4 border border-border mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crédito disponible</p>
              <p className="text-lg font-semibold">
                {formatCurrency(saldo)}
                <span className="text-sm text-muted-foreground ml-2">
                  (Límite: {formatCurrency(-limite)})
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Valor de tu oferta</p>
              <p className="text-lg font-semibold gold-text">
                Basado en tus productos
              </p>
            </div>
          </div>
        </div>

        {/* Grid de coincidencias */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span className="ml-2 text-muted-foreground">Buscando coincidencias...</span>
          </div>
        ) : error ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error al cargar coincidencias</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Intenta de nuevo más tarde"}
            </p>
          </div>
        ) : Array.isArray(coincidencias) && coincidencias.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coincidencias
              .filter((item: MarketItem) => item && item.id)
              .map((item: MarketItem) => (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-gold/30"
                onClick={() => navigate(`/producto/${item.id}`)}
              >
                <div className="relative group">
                  <img
                    src={item.imagen || 'https://via.placeholder.com/300x200'}
                    alt={item.titulo || 'Producto'}
                    className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200';
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/95 hover:bg-background backdrop-blur-sm text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorito(item.id);
                    }}
                  >
                    <Heart
                      className={`w-5 h-5 transition-all ${
                        favoritos.includes(item.id) 
                          ? "fill-red-500 text-red-500" 
                          : "text-foreground/70 hover:text-red-500"
                      }`}
                    />
                  </Button>
                  <Badge className="absolute top-2 left-2 bg-background/95 backdrop-blur-sm text-foreground border border-border/50">
                    {RUBROS[item.rubro as keyof typeof RUBROS]?.icon}{" "}
                    {RUBROS[item.rubro as keyof typeof RUBROS]?.label}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-base line-clamp-2 flex-1 hover:text-gold transition-colors">
                      {item.titulo}
                    </h3>
                    <span className="text-xl font-bold gold-text flex-shrink-0">
                      {formatCurrency(item.precio)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.descripcion}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{item.ubicacion}</span>
                    </div>
                    {item.distancia && (
                      <span className="flex-shrink-0">{item.distancia} km</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{item.rating || 0}</span>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-gold hover:bg-gold/90 text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/producto/${item.id}`);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Ver más
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No encontramos coincidencias con el valor de tu oferta
            </p>
            <p className="text-sm text-muted-foreground">
              {(!coincidencias || (Array.isArray(coincidencias) && coincidencias.length === 0))
                ? "Crea productos o servicios para encontrar coincidencias"
                : "Buscamos productos/servicios con valor similar a los tuyos (±20%)"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Coincidencias;
