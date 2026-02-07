import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, Loader2, MessageCircle } from "lucide-react";
import { intercambiosService, Intercambio } from "@/services/intercambios.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { userService } from "@/services/user.service";
import { chatService } from "@/services/chat.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function formatFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MisCompras = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { formatIX } = useCurrencyVariant();

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;

  const { data: intercambios = [], isLoading } = useQuery({
    queryKey: ['intercambios', currentUser?.id],
    queryFn: () => intercambiosService.getByUserId(currentUser!.id!),
    enabled: !!currentUser?.id,
  });

  const iniciarChatMutation = useMutation({
    mutationFn: ({ vendedorId, marketItemId }: { vendedorId: number; marketItemId?: number }) =>
      chatService.iniciarConversacion(marketItemId ? { marketItemId } : { vendedorId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      navigate(`/chat/${data.conversacionId}`);
    },
  });

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  // Compras = intercambios donde el usuario pagó (usuarioId === currentUser y creditos < 0)
  const compras = intercambios.filter(
    (i: Intercambio) => i.usuarioId === currentUser.id && i.creditos < 0
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mis compras</h1>
            <p className="text-muted-foreground">
              Productos y servicios que compraste o contrataste
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : compras.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tenés compras. Explorá el market y contactá a los vendedores.
              </p>
              <Button variant="gold" onClick={() => navigate("/market")}>
                Explorar productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...compras]
              .sort((a, b) => new Date(b.fecha || b.createdAt || 0).getTime() - new Date(a.fecha || a.createdAt || 0).getTime())
              .map((i) => {
                const cantidad = Math.abs(i.creditos);
                const marketItemId = (i as any).marketItemId;
                return (
                  <Card key={i.id} className="hover:border-gold/30 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-secondary">
                            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Pagaste {formatIX(cantidad)}
                            </p>
                            <p className="text-sm text-muted-foreground">{i.descripcion}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              A: {i.otraPersonaNombre} • {formatFecha(i.fecha || i.createdAt || "")}
                            </p>
                            {i.estado && (
                              <Badge variant={i.estado === "confirmado" ? "default" : "secondary"} className="mt-2 text-xs">
                                {i.estado}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-muted-foreground">
                            -{formatIX(cantidad)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => iniciarChatMutation.mutate({ vendedorId: i.otraPersonaId, marketItemId })}
                            disabled={iniciarChatMutation.isPending}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Contactar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MisCompras;
