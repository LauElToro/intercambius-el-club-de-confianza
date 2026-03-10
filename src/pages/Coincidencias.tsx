import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Sparkles, MapPin, MessageCircle, Heart, AlertCircle, Loader2, Search, Repeat, Package } from "lucide-react";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { userService } from "@/services/user.service";
import { coincidenciasService } from "@/services/coincidencias.service";
import { busquedasService } from "@/services/busquedas.service";
import { marketService, MarketItem } from "@/services/market.service";
import { chatService } from "@/services/chat.service";
import { useToast } from "@/components/ui/use-toast";
import { GuiaCoincidencias } from "@/components/onboarding/GuiaCoincidencias";

const RUBROS = {
  servicios: { label: "Servicios", icon: "🔧" },
  productos: { label: "Productos", icon: "📦" },
  alimentos: { label: "Alimentos", icon: "🍎" },
  experiencias: { label: "Experiencias", icon: "🎭" }
};

const Coincidencias = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { puedeRegistrarBusquedas } = useCookieConsent();
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [miProductoId, setMiProductoId] = useState<number | null>(null);
  const [buscarEnMarketplace, setBuscarEnMarketplace] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;

  const { data: misProductosResponse } = useQuery({
    queryKey: ['marketItems', 'mis-productos', currentUser?.id],
    queryFn: () => marketService.getItems({ vendedorId: currentUser!.id!, page: 1, limit: 100 }),
    enabled: !!currentUser?.id,
  });

  const misProductos = misProductosResponse?.data ?? [];

  const { data: coincidencias = [], isLoading: loadingCoincidencias, error: errorCoincidencias } = useQuery({
    queryKey: ['coincidencias', currentUser?.id],
    queryFn: () => {
      if (!currentUser?.id) throw new Error('Usuario no autenticado');
      return coincidenciasService.getCoincidencias(currentUser.id);
    },
    enabled: !!currentUser?.id && !buscarEnMarketplace,
  });

  const { data: marketResult, isLoading: loadingMarket } = useQuery({
    queryKey: ['marketItems', 'busqueda', search.trim(), currentUser?.id],
    queryFn: () => marketService.getItems({ search: search.trim(), page: 1, limit: 50 }),
    enabled: !!currentUser?.id && buscarEnMarketplace,
  });

  const itemsBuscados = marketResult?.data ?? [];

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const iniciarIntercambioMutation = useMutation({
    mutationFn: ({
      itemDestino,
      miProducto,
    }: {
      itemDestino: MarketItem;
      miProducto: MarketItem;
    }) => {
      const miProductoImagenUrl =
        miProducto.images?.[0]?.url || miProducto.imagen || '';
      return chatService.iniciarIntercambio({
        marketItemId: itemDestino.id,
        miProductoTitulo: miProducto.titulo,
        otroUsuarioNombre: itemDestino.vendedor?.nombre || '',
        miProductoUrl: miProducto.id ? `${baseUrl}/producto/${miProducto.id}` : undefined,
        miProductoImagenUrl: miProductoImagenUrl || undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      toast({ title: "¡Mensaje enviado!", description: "Ya podés negociar el intercambio por chat." });
      navigate(`/chat/${data.conversacionId}`);
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar el intercambio",
        variant: "destructive",
      });
    },
  });

  const toggleFavorito = (id: number) => {
    setFavoritos(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const recordRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!puedeRegistrarBusquedas || !currentUser?.id) return;
    recordRef.current && clearTimeout(recordRef.current);
    recordRef.current = setTimeout(() => {
      busquedasService.registrar({ termino: search, seccion: 'coincidencias' });
    }, 800);
    return () => { recordRef.current && clearTimeout(recordRef.current); };
  }, [search, puedeRegistrarBusquedas, currentUser?.id]);

  const listaBase = buscarEnMarketplace ? itemsBuscados : coincidencias;
  const coincidenciasFiltradas = useMemo(() => {
    const list = Array.isArray(listaBase) ? listaBase : [];
    const sinPropios = list.filter((item: MarketItem) => item.vendedorId !== currentUser?.id);
    if (!search.trim() || buscarEnMarketplace) return sinPropios;
    const q = search.toLowerCase().trim();
    return sinPropios.filter(
      (item: MarketItem) =>
        (item.titulo || '').toLowerCase().includes(q) ||
        (item.descripcion || '').toLowerCase().includes(q)
    );
  }, [listaBase, search, buscarEnMarketplace, currentUser?.id]);

  const miProductoSeleccionado = misProductos.find(p => p.id === miProductoId);
  const isLoading = buscarEnMarketplace ? loadingMarket : loadingCoincidencias;

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

  const { formatIX } = useCurrencyVariant();
  const saldo = Number(currentUser?.saldo ?? 0) || 0;
  const limite = Number(currentUser?.limite ?? 0) || 150000;
  const puedeComprar = saldo > -limite;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Intercambius
            </h1>
          </div>
          <p className="text-muted-foreground">
            Elegí lo que ofrecés, buscá lo que querés y negociá en Intercambius
          </p>
        </div>

        <GuiaCoincidencias />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar: buscador para filtrar coincidencias */}
          <aside className="lg:w-80 flex-shrink-0 w-full lg:block">
            <Card className="sticky top-20 border-border">
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold" />
                    ¿Qué ofrecés a cambio?
                  </h2>
                  <p className="text-sm text-muted-foreground mb-2">Producto o servicio que tenés</p>
                  <select
                    value={miProductoId ?? ""}
                    onChange={(e) => setMiProductoId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {misProductos.map((p) => (
                      <option key={p.id} value={p.id}>{p.titulo}</option>
                    ))}
                  </select>
                  {misProductos.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Creá un producto en{" "}
                      <button type="button" onClick={() => navigate("/mis-publicaciones")} className="text-gold hover:underline">
                        Mis publicaciones
                      </button>
                    </p>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    ¿Qué te interesa?
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Buscá lo que querés intercambiar
                  </p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    // La búsqueda ya filtra en vivo; Enter o click en lupita confirman
                    document.getElementById("coincidencias-resultados")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="coincidencias-buscar"
                      placeholder="Ej: bicicleta, clases de yoga..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-2"
                      aria-label="Buscar en coincidencias"
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="icon" title="Buscar" className="shrink-0">
                    <Search className="w-4 h-4" />
                  </Button>
                </form>
                <label className="flex items-center gap-2 mt-3 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={buscarEnMarketplace}
                    onChange={(e) => setBuscarEnMarketplace(e.target.checked)}
                    className="rounded border-input"
                  />
                  Buscar en todo el marketplace
                </label>
                </div>
              </div>
            </Card>
          </aside>

          {/* Contenido principal */}
          <div id="coincidencias-resultados" className="flex-1">
        {/* Alerta de crédito */}
        {!puedeComprar && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el límite de crédito negativo ({formatIX(limite)}). 
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
                {formatIX(saldo)}
                <span className="text-sm text-muted-foreground ml-2">
                  (Límite: {formatIX(-limite)})
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Tu oferta</p>
              <p className="text-lg font-semibold gold-text truncate max-w-[200px] ml-auto">
                {miProductoSeleccionado ? miProductoSeleccionado.titulo : "Seleccioná un producto"}
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
        ) : (errorCoincidencias && !buscarEnMarketplace) ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error al cargar coincidencias</p>
            <p className="text-sm text-muted-foreground">
              {errorCoincidencias instanceof Error ? errorCoincidencias.message : "Intenta de nuevo más tarde"}
            </p>
          </div>
        ) : coincidenciasFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coincidenciasFiltradas
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
                      {formatIX(item.precio)}
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
                      disabled={!miProductoSeleccionado || iniciarIntercambioMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!miProductoSeleccionado) {
                          toast({ title: "Seleccioná tu producto", description: "Elegí qué ofrecés a cambio en el panel de la izquierda.", variant: "destructive" });
                          return;
                        }
                        iniciarIntercambioMutation.mutate({
                          itemDestino: item,
                          miProducto: miProductoSeleccionado,
                        });
                      }}
                    >
                      {iniciarIntercambioMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Repeat className="w-4 h-4 mr-1" />
                      )}
                      Intercambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2 font-medium">
              {search.trim()
                ? "No hay resultados para tu búsqueda"
                : "No hay coincidencias para mostrar"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {search.trim()
                ? "Probá con otros términos o activá \"Buscar en todo el marketplace\" en el panel de la izquierda."
                : misProductos.length === 0
                  ? "Creá primero un producto o servicio en Mis publicaciones. Así podremos mostrarte coincidencias con valor similar."
                  : buscarEnMarketplace
                    ? "Probá otra búsqueda o desactivá \"Buscar en todo el marketplace\" para ver recomendaciones por precio."
                    : "Buscamos productos con valor similar a los tuyos. Marcá \"Buscar en todo el marketplace\" para explorar más opciones."}
            </p>
            {misProductos.length === 0 && (
              <Button variant="gold" onClick={() => navigate("/crear-producto")}>
                Crear mi primer producto
              </Button>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Coincidencias;
