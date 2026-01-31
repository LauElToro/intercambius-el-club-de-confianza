import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MapPin, MessageCircle, Loader2 } from "lucide-react";
import { favoritosService } from "@/services/favoritos.service";
import { marketService, MarketItem } from "@/services/market.service";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";

const RUBROS: Record<string, { label: string; icon: string }> = {
  servicios: { label: "Servicios", icon: "🔧" },
  productos: { label: "Productos", icon: "📦" },
  alimentos: { label: "Alimentos", icon: "🍎" },
  experiencias: { label: "Experiencias", icon: "🎭" },
};

const Favoritos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favoritos = [], isLoading } = useQuery({
    queryKey: ['favoritos'],
    queryFn: () => favoritosService.getFavoritos(),
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: (marketItemId: number) => favoritosService.toggleFavorito(marketItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
    },
  });

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Iniciá sesión para ver tus favoritos</p>
          <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mis favoritos</h1>
            <p className="text-muted-foreground">Productos y servicios que guardaste</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : favoritos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                Aún no tenés favoritos. Explorá el market y guardá lo que te interese.
              </p>
              <Button variant="gold" onClick={() => navigate("/market")}>
                Explorar Market
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoritos.map((item: MarketItem) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:border-gold/50 transition-colors group"
              >
                <Link to={`/market/${item.id}`}>
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={item.imagen || (item.images?.[0]?.url) || "https://via.placeholder.com/300x200"}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/95"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleMutation.mutate(item.id);
                      }}
                    >
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="text-xs mb-2">
                    {RUBROS[item.rubro]?.icon} {RUBROS[item.rubro]?.label ?? item.rubro}
                  </Badge>
                  <Link to={`/market/${item.id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:text-gold mb-1">{item.titulo}</h3>
                  </Link>
                  <p className="font-bold text-gold mb-2">{formatCurrency(item.precio)}</p>
                  {item.ubicacion && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3" />
                      {item.ubicacion}
                    </p>
                  )}
                  <Link to={`/market/${item.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Ver detalle
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favoritos;
