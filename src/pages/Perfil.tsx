import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, ArrowLeft, Loader2 } from "lucide-react";
import { userService } from "@/services/user.service";
import { marketService } from "@/services/market.service";

const Perfil = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: usuario, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(Number(id!)),
    enabled: !!id,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['marketItems', 'perfil', id],
    queryFn: () => marketService.getItems({ vendedorId: Number(id!) }),
    enabled: !!id && !!usuario,
  });

  if (isLoading || !usuario) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Perfil no encontrado</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            Volver
          </Button>
        </div>
      </Layout>
    );
  }

  const iniciales = usuario.nombre
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-gold/20 text-gold">
                  {iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{usuario.nombre}</h1>
                {usuario.ubicacion && (
                  <div className="flex items-center gap-1 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{usuario.ubicacion}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{usuario.rating ?? 0}/5</span>
                  <span className="text-sm text-muted-foreground">
                    ({usuario.totalResenas ?? 0} reseñas)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para contactar, comprá o contratá uno de sus productos. Podrás chatear después de la compra.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {productos.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Este usuario aún no tiene publicaciones.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productos.map((item) => (
                  <Link key={item.id} to={`/producto/${item.id}`}>
                    <Card className="overflow-hidden hover:border-gold/50 transition-colors cursor-pointer">
                      <div className="aspect-video bg-muted">
                        <img
                          src={item.imagen || "https://via.placeholder.com/300x200"}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium line-clamp-2">{item.titulo}</h3>
                        <p className="text-gold font-bold">{item.precio} IX</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Perfil;
