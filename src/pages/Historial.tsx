import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Receipt, ShoppingBag, MessageCircle, ExternalLink } from "lucide-react";
import { intercambiosService } from "@/services/intercambios.service";
import { chatService } from "@/services/chat.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { userService } from "@/services/user.service";
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

const Historial = () => {
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

  const iniciarChatMutation = useMutation({
    mutationFn: ({ vendedorId, marketItemId }: { vendedorId: number; marketItemId?: number }) =>
      chatService.iniciarConversacion(marketItemId ? { marketItemId } : { vendedorId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      navigate(`/chat/${data.conversacionId}`);
    },
  });

  const { data: intercambios = [], isLoading } = useQuery({
    queryKey: ['intercambios', currentUser?.id],
    queryFn: () => intercambiosService.getByUserId(currentUser!.id!),
    enabled: !!currentUser?.id,
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

  const esRecibido = (i: { usuarioId: number; creditos: number }) =>
    (i.usuarioId === currentUser.id && i.creditos > 0) ||
    (i.otraPersonaId === currentUser.id && i.creditos < 0);

  const otraPersona = (i: { usuarioId: number; otraPersonaId: number; otraPersonaNombre: string }) =>
    i.usuarioId === currentUser.id ? i.otraPersonaNombre : "Usuario";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Receipt className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mi historial</h1>
            <p className="text-muted-foreground">
              Todo lo que compraste, contrataste o vendiste
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : intercambios.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tenés movimientos registrados. Los intercambios se registran automáticamente cuando pagás un producto con IX desde el checkout.
              </p>
              <Button variant="gold" onClick={() => navigate("/market")}>
                Explorar productos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...intercambios]
              .sort((a, b) => new Date(b.fecha || b.createdAt || 0).getTime() - new Date(a.fecha || a.createdAt || 0).getTime())
              .map((i) => {
                const recibido = esRecibido(i);
                const cantidad = Math.abs(i.creditos);
                const conQuien = otraPersona(i);
                const marketItemId = (i as any).marketItemId;
                const item = (i as any).marketItem;
                const imgUrl = item?.imagenPrincipal || item?.imagen || (item?.imagenes?.[0] as any)?.url;
                return (
                  <Card key={i.id} className="hover:border-gold/30 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex sm:flex-row gap-3 sm:flex-1 p-4">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 bg-secondary overflow-hidden">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item?.titulo || "Producto"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">
                              {item?.titulo || i.descripcion}
                            </h3>
                            {item?.descripcion && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                {item.descripcion}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                              {item?.rubro && (
                                <span className="capitalize">{item.rubro}</span>
                              )}
                              {item?.ubicacion && (
                                <span>• {item.ubicacion}</span>
                              )}
                              {item?.condition && (
                                <span>• {item.condition}</span>
                              )}
                              {item?.tipoPago && item.tipoPago !== "ix" && (
                                <span>• Pago: {item.tipoPago}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {recibido ? "Recibiste" : "Pagaste"} {formatIX(cantidad)} • {recibido ? `De: ${conQuien}` : `A: ${conQuien}`} • {formatFecha(i.fecha || i.createdAt || "")}
                            </p>
                            {i.estado && (
                              <Badge variant={i.estado === "confirmado" ? "default" : "secondary"} className="mt-2 text-xs">
                                {i.estado}
                              </Badge>
                            )}
                            {item?.detalles && Object.keys(item.detalles).length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {Object.entries(item.detalles).slice(0, 3).map(([k, v]) => (
                                  <span key={k} className="mr-2">
                                    <span className="capitalize">{k}:</span> {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex sm:flex-col items-center sm:items-end justify-between gap-2 p-4 sm:px-6 border-t sm:border-t-0 sm:border-l border-border ${recibido ? "bg-primary/5" : "bg-muted/30"}`}>
                          <span className={`text-lg font-bold ${recibido ? "text-primary" : "text-muted-foreground"}`}>
                            {recibido ? "+" : "-"}{formatIX(cantidad)}
                          </span>
                          <div className="flex sm:flex-col gap-2">
                            {marketItemId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/producto/${marketItemId}`)}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Ver publicación
                              </Button>
                            )}
                            <Button
                              variant={marketItemId ? "outline" : "default"}
                              size="sm"
                              onClick={() => iniciarChatMutation.mutate({ vendedorId: i.otraPersonaId, marketItemId })}
                              disabled={iniciarChatMutation.isPending}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Contactar
                            </Button>
                          </div>
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

export default Historial;
