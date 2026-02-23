import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Plus, MapPin, MessageCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { marketService, MarketItem } from "@/services/market.service";
import { intercambiosService } from "@/services/intercambios.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RUBROS: Record<string, { label: string; icon: string }> = {
  servicios: { label: "Servicios", icon: "🔧" },
  productos: { label: "Productos", icon: "📦" },
  alimentos: { label: "Alimentos", icon: "🍎" },
  experiencias: { label: "Experiencias", icon: "🎭" },
};

const MisPublicaciones = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [itemToDelete, setItemToDelete] = useState<MarketItem | null>(null);
  const [page, setPage] = useState(1);
  const PRODUCTOS_POR_PAGINA = 12;

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;
  const { formatIX } = useCurrencyVariant();

  const { data: productosResponse, isLoading } = useQuery({
    queryKey: ['marketItems', 'mis-productos', currentUser?.id, page],
    queryFn: () => marketService.getItems({
      vendedorId: currentUser!.id!,
      page,
      limit: PRODUCTOS_POR_PAGINA,
    }),
    enabled: !!currentUser?.id,
  });

  const productos = productosResponse?.data ?? [];
  const totalProductos = productosResponse?.total ?? 0;
  const totalPages = productosResponse?.totalPages ?? 1;

  useEffect(() => setPage(1), [currentUser?.id]);

  const { data: intercambios = [] } = useQuery({
    queryKey: ['intercambios', currentUser?.id],
    queryFn: () => intercambiosService.getByUserId(currentUser!.id!),
    enabled: !!currentUser?.id,
  });

  const ventas = intercambios.filter(
    (i) => (i.usuarioId === currentUser!.id && i.creditos > 0) || (i.otraPersonaId === currentUser!.id && i.creditos < 0)
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => marketService.deleteItem(id),
    onSuccess: () => {
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['marketItems'] });
      queryClient.invalidateQueries({ queryKey: ['marketItems', 'mis-productos'] });
      toast({
        title: "Producto eliminado",
        description: "La publicación fue eliminada correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, item: MarketItem) => {
    e.preventDefault();
    e.stopPropagation();
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Mis publicaciones</h1>
            <p className="text-muted-foreground mt-1">
              Gestioná tus productos y servicios publicados
            </p>
          </div>
          <Link to="/crear-producto">
            <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo producto/servicio
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : productos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tenés publicaciones. Creá tu primer producto o servicio.
              </p>
              <Link to="/crear-producto">
                <Button variant="gold">Crear publicación</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
          {ventas.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Historial de ventas/contrataciones</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Personas que compraron o contrataron tus productos/servicios
                </p>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {ventas.slice(0, 10).map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{v.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.usuarioId === currentUser!.id ? v.otraPersonaNombre : "Usuario"} • {new Date(v.fecha || v.createdAt || "").toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">+{formatIX(Math.abs(v.creditos))}</span>
                    </div>
                  ))}
                </div>
                <Link to="/historial">
                  <Button variant="ghost" size="sm" className="mt-3">Ver historial completo</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((item: MarketItem) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:border-gold/30 transition-colors group"
              >
                <Link to={`/producto/${item.id}`} className="block">
                  <div className="aspect-video bg-muted">
                    <img
                      src={item.imagen || "https://via.placeholder.com/300x200"}
                      alt={item.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {RUBROS[item.rubro]?.icon} {RUBROS[item.rubro]?.label ?? item.rubro}
                    </Badge>
                    <span className="font-bold text-gold">{formatIX(item.precio)}</span>
                  </div>
                  <Link to={`/producto/${item.id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:text-gold mb-1">
                      {item.titulo}
                    </h3>
                  </Link>
                  {item.ubicacion && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3" />
                      {item.ubicacion}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/producto/${item.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    <Link to={`/editar-producto/${item.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteClick(e, item)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && itemToDelete?.id === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          </>
        )}

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La publicación "{itemToDelete?.titulo}" será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmDelete();
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default MisPublicaciones;
