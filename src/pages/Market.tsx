import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  Heart, 
  MessageCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Navigation
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UnifiedMapView } from "@/components/map/UnifiedMapView";
import { marketService, MarketItem } from "@/services/market.service";
import { favoritosService } from "@/services/favoritos.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { busquedasService } from "@/services/busquedas.service";
import { resolveUbicacionToCoords, UBICACIONES_COORDENADAS } from "@/lib/ubicaciones";
import { DEFAULT_MAP_CENTER } from "@/lib/geo";

// Tipos de rubros y sus filtros específicos
const RUBROS = {
  servicios: {
    label: "Servicios",
    icon: "🔧",
    filters: {
      tipo: ["Reparaciones", "Limpieza", "Clases", "Consultoría", "Diseño", "Fotografía", "Otros"],
      modalidad: ["Presencial", "Online", "Ambos"],
      experiencia: ["Principiante", "Intermedio", "Avanzado", "Profesional"]
    }
  },
  productos: {
    label: "Productos",
    icon: "📦",
    filters: {
      categoria: ["Electrónica", "Ropa", "Hogar", "Deportes", "Libros", "Juguetes", "Otros"],
      estado: ["Nuevo", "Usado - Como nuevo", "Usado - Buen estado", "Usado - Aceptable"],
      entrega: ["Retiro", "Envío", "Ambos"]
    }
  },
  alimentos: {
    label: "Alimentos",
    icon: "🍎",
    filters: {
      tipo: ["Orgánico", "Vegano", "Sin TACC", "Casero", "Artesanal", "Otros"],
      conservacion: ["Fresco", "Congelado", "Envasado", "Seco"],
      cantidad: ["Individual", "Familiar", "Mayorista"]
    }
  },
  experiencias: {
    label: "Experiencias",
    icon: "🎭",
    filters: {
      tipo: ["Eventos", "Talleres", "Tours", "Actividades", "Otros"],
      duracion: ["1 hora", "2-4 horas", "Medio día", "Día completo"],
      participantes: ["Individual", "Pareja", "Grupo pequeño", "Grupo grande"]
    }
  }
};

const Market = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { puedeRegistrarBusquedas } = useCookieConsent();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const usuario = currentUser || user;
  const { formatIX } = useCurrencyVariant();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"todos" | "productos" | "servicios">("todos");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string>("todos");
  const [distanciaMax, setDistanciaMax] = useState([25]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [precioMin, setPrecioMin] = useState([0]);
  const [precioMax, setPrecioMax] = useState([500000]);
  const [filtrosRubro, setFiltrosRubro] = useState<Record<string, string[]>>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [favoritosLocal, setFavoritosLocal] = useState<number[]>([]);
  const [elegirUbicacionOpen, setElegirUbicacionOpen] = useState(false);
  const [busquedaUbicacion, setBusquedaUbicacion] = useState("");
  const [page, setPage] = useState(1);

  const { data: favoritosData = [] } = useQuery({
    queryKey: ['favoritos'],
    queryFn: () => favoritosService.getFavoritos(),
    enabled: !!user,
  });

  const favoritosIds = user ? (favoritosData.map((f: MarketItem) => f.id)) : favoritosLocal;

  const toggleFavMutation = useMutation({
    mutationFn: (marketItemId: number) => favoritosService.toggleFavorito(marketItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
    },
  });

  const sinLimiteDistancia = distanciaMax[0] >= 100;

  // Registrar búsqueda cuando cambian filtros (debounced, solo si cookies aceptadas)
  const recordRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!puedeRegistrarBusquedas || !user) return;
    recordRef.current && clearTimeout(recordRef.current);
    recordRef.current = setTimeout(() => {
      busquedasService.registrar({
        termino: searchApplied,
        seccion: 'market',
        filtros: {
          tipo: tipoSeleccionado !== 'todos' ? tipoSeleccionado : undefined,
          rubro: rubroSeleccionado !== 'todos' ? rubroSeleccionado : undefined,
          precioMin: precioMin[0],
          precioMax: precioMax[0],
          distanciaMax: userLocation ? distanciaMax[0] : undefined,
        },
      });
    }, 800);
    return () => { recordRef.current && clearTimeout(recordRef.current); };
  }, [searchApplied, tipoSeleccionado, rubroSeleccionado, precioMin[0], precioMax[0], distanciaMax[0], userLocation, puedeRegistrarBusquedas, user]);

  // Obtener items del backend (paginado, filtro de distancia y búsqueda en servidor)
  const { data: marketResponse, isLoading, error } = useQuery({
    queryKey: ['marketItems', rubroSeleccionado, tipoSeleccionado, precioMin[0], precioMax[0], userLocation, distanciaMax[0], sinLimiteDistancia, searchApplied, page],
    queryFn: () => marketService.getItems({
      rubro: rubroSeleccionado !== 'todos' ? rubroSeleccionado as any : undefined,
      tipo: tipoSeleccionado !== 'todos' ? tipoSeleccionado : undefined,
      precioMin: precioMin[0],
      precioMax: precioMax[0],
      search: searchApplied.trim() || undefined,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
      distanciaMax: userLocation && !sinLimiteDistancia ? distanciaMax[0] : undefined,
      page,
      limit: 24,
      soloDisponibles: true,
    }),
  });

  const items = marketResponse?.data ?? [];
  const totalItems = marketResponse?.total ?? 0;
  const totalPages = marketResponse?.totalPages ?? 1;

  // Reset a página 1 cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [rubroSeleccionado, tipoSeleccionado, precioMin[0], precioMax[0], userLocation, distanciaMax[0], searchApplied]);

  // Por defecto usar la ubicación del perfil del usuario
  const appliedProfileLocation = useRef(false);
  useEffect(() => {
    const ubicacion = usuario?.ubicacion?.trim();
    if (!ubicacion || appliedProfileLocation.current) return;
    const resolved = resolveUbicacionToCoords(ubicacion);
    if (resolved) {
      setUserLocation({ lat: resolved.lat, lng: resolved.lng });
      setLocationError(null);
      appliedProfileLocation.current = true;
    }
  }, [usuario?.ubicacion]);

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        setLocationError(err.code === 1 ? 'Permiso denegado' : 'No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const usarUbicacionPerfil = () => {
    const ubicacion = usuario?.ubicacion?.trim();
    if (!ubicacion) return;
    const resolved = resolveUbicacionToCoords(ubicacion);
    if (resolved) {
      setUserLocation({ lat: resolved.lat, lng: resolved.lng });
      setLocationError(null);
    }
  };

  // Obtener filtros específicos del rubro seleccionado
  const filtrosDisponibles = rubroSeleccionado !== "todos" && rubroSeleccionado in RUBROS
    ? RUBROS[rubroSeleccionado as keyof typeof RUBROS].filters
    : null;

  // Función para actualizar filtros de rubro
  const actualizarFiltroRubro = (categoria: string, valor: string) => {
    setFiltrosRubro(prev => {
      const actual = prev[categoria] || [];
      const nuevo = actual.includes(valor)
        ? actual.filter(v => v !== valor)
        : [...actual, valor];
      return { ...prev, [categoria]: nuevo };
    });
  };

  // Aplicar búsqueda con Enter
  const aplicarBusqueda = () => {
    setSearchApplied(searchInput.trim());
    setPage(1);
  };

  // Filtrar items (filtros del lado del cliente para detalles del rubro; búsqueda se hace en servidor)
  const itemsFiltrados = useMemo(() => {
    return items.filter((item: MarketItem) => {
      // No mostrar publicaciones ya vendidas
      if (item.disponible === false) return false;
      // Filtros específicos del rubro (detalles)
      if (filtrosDisponibles && item.detalles) {
        for (const [categoria, valores] of Object.entries(filtrosRubro)) {
          if (valores.length > 0) {
            const valorItem = item.detalles[categoria];
            if (!valorItem || !valores.includes(valorItem)) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [items, filtrosRubro, filtrosDisponibles]);

  const toggleFavorito = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (user) {
      toggleFavMutation.mutate(id);
    } else {
      setFavoritosLocal(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    }
  };

  const limpiarFiltros = () => {
    setSearchInput("");
    setSearchApplied("");
    setTipoSeleccionado("todos");
    setRubroSeleccionado("todos");
    setDistanciaMax([25]);
    setPage(1);
    setUserLocation(null);
    setLocationError(null);
    setPrecioMin([0]);
    setPrecioMax([500000]);
    setFiltrosRubro({});
  };

  const tieneFiltrosActivos = searchApplied || tipoSeleccionado !== "todos" || rubroSeleccionado !== "todos" || 
    userLocation !== null || distanciaMax[0] < 25 || precioMin[0] > 0 || precioMax[0] < 500000 ||
    Object.values(filtrosRubro).some(v => v.length > 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Market</h1>
          <p className="text-muted-foreground">
            Encontrá servicios, productos y experiencias en tu comunidad
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de Filtros */}
          {mostrarFiltros && (
            <aside className="lg:w-80 flex-shrink-0 w-full lg:block">
            <Card className="sticky top-20 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    <h2 className="font-semibold">Filtros</h2>
                  </div>
                  {tieneFiltrosActivos && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={limpiarFiltros}
                      className="h-8 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                  <div className="space-y-6">
                    {/* Búsqueda (Enter para buscar, match ~70%) */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Buscar</label>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          aplicarBusqueda();
                        }}
                      >
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar... (Enter)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') aplicarBusqueda();
                            }}
                            className="pl-9"
                          />
                        </div>
                      </form>
                    </div>

                    {/* Tipo (Productos/Servicios) */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo</label>
                      <Select value={tipoSeleccionado} onValueChange={(value) => {
                        setTipoSeleccionado(value as "todos" | "productos" | "servicios");
                        setRubroSeleccionado("todos");
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="productos">📦 Productos</SelectItem>
                          <SelectItem value="servicios">🔧 Servicios</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rubro */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rubro</label>
                      <Select value={rubroSeleccionado} onValueChange={setRubroSeleccionado}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos los rubros</SelectItem>
                          {Object.entries(RUBROS).map(([key, rubro]) => {
                            // Filtrar rubros según el tipo seleccionado
                            if (tipoSeleccionado === "productos" && key !== "productos" && key !== "alimentos") {
                              return null;
                            }
                            if (tipoSeleccionado === "servicios" && key !== "servicios" && key !== "experiencias") {
                              return null;
                            }
                            return (
                              <SelectItem key={key} value={key}>
                                {rubro.icon} {rubro.label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Distancia */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Distancia máxima: {distanciaMax[0] >= 100 ? '100+ km (todas)' : `${distanciaMax[0]} km`}
                      </label>
                      <Slider
                        value={distanciaMax}
                        onValueChange={setDistanciaMax}
                        max={120}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 km</span>
                        <span>100+ km = todas</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant={userLocation ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={getMyLocation}
                          disabled={locationLoading}
                        >
                          <Navigation className={`w-4 h-4 mr-2 ${locationLoading ? 'animate-spin' : ''}`} />
                          {locationLoading ? 'Obteniendo...' : userLocation ? 'Activa' : 'GPS'}
                        </Button>
                        <Dialog open={elegirUbicacionOpen} onOpenChange={setElegirUbicacionOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="flex-1">
                              <MapPin className="w-4 h-4 mr-2" />
                              Elegir
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Elegir zona de búsqueda</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <Input
                                placeholder="Buscar ciudad, barrio..."
                                value={busquedaUbicacion}
                                onChange={(e) => setBusquedaUbicacion(e.target.value)}
                              />
                              <UnifiedMapView
                                center={userLocation ?? DEFAULT_MAP_CENTER}
                                radiusKm={distanciaMax[0] >= 100 ? 25 : distanciaMax[0]}
                                height={200}
                                markers={items
                                  .filter((i) => i.lat != null && i.lng != null)
                                  .slice(0, 30)
                                  .map((i) => ({
                                    lat: i.lat!,
                                    lng: i.lng!,
                                    title: i.titulo,
                                  }))}
                              />
                              <ScrollArea className="h-36">
                                <div className="space-y-1">
                                  {Object.entries(UBICACIONES_COORDENADAS)
                                    .filter(([name]) => !busquedaUbicacion || name.toLowerCase().includes(busquedaUbicacion.toLowerCase()))
                                    .map(([name]) => (
                                      <Button
                                        key={name}
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => {
                                          setUserLocation(UBICACIONES_COORDENADAS[name]);
                                          setLocationError(null);
                                          setElegirUbicacionOpen(false);
                                        }}
                                      >
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {name}
                                      </Button>
                                    ))}
                                </div>
                              </ScrollArea>
                              <p className="text-xs text-muted-foreground">
                                Se mostrarán publicaciones dentro del radio elegido.
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {userLocation && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-xs"
                          onClick={() => setUserLocation(null)}
                        >
                          Quitar filtro de ubicación
                        </Button>
                      )}
                      {locationError && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {locationError === 'Permiso denegado'
                            ? 'Activá la ubicación en la configuración del navegador, o usá la de tu perfil.'
                            : locationError}
                        </p>
                      )}
                      {!userLocation && usuario?.ubicacion && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-xs h-8"
                          onClick={usarUbicacionPerfil}
                        >
                          Usar "{usuario.ubicacion}" (de mi perfil)
                        </Button>
                      )}
                      {!userLocation && !locationError && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Activa tu ubicación para filtrar por distancia
                        </p>
                      )}
                      {!userLocation && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">
                          Sin ubicación se muestran todas las publicaciones
                        </p>
                      )}
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Precio (IOX)</label>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Mínimo</label>
                          <Slider
                            value={precioMin}
                            onValueChange={setPrecioMin}
                            max={precioMax[0] - 10}
                            min={0}
                            step={10}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatIX(precioMin[0])}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Máximo</label>
                          <Slider
                            value={precioMax}
                            onValueChange={setPrecioMax}
                            max={500000}
                            min={precioMin[0] + 10}
                            step={1000}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatIX(precioMax[0])}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtros específicos del rubro */}
                    {filtrosDisponibles && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-medium mb-3">
                            Filtros de {RUBROS[rubroSeleccionado as keyof typeof RUBROS].label}
                          </h3>
                          <div className="space-y-4">
                            {Object.entries(filtrosDisponibles).map(([categoria, opciones]) => (
                              <Collapsible key={categoria} defaultOpen={false}>
                                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-foreground transition-colors">
                                  <span className="capitalize">{categoria}</span>
                                  <ChevronDown className="w-4 h-4 transition-transform data-[state=open]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="space-y-2 pl-2">
                                    {opciones.map(opcion => (
                                      <div key={opcion} className="flex items-center space-x-2 py-1">
                                        <Checkbox
                                          id={`${categoria}-${opcion}`}
                                          checked={filtrosRubro[categoria]?.includes(opcion) || false}
                                          onCheckedChange={() => actualizarFiltroRubro(categoria, opcion)}
                                        />
                                        <label
                                          htmlFor={`${categoria}-${opcion}`}
                                          className="text-sm cursor-pointer flex-1 hover:text-foreground transition-colors"
                                        >
                                          {opcion}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>
          )}

          {/* Contenido principal */}
          <div className="flex-1">
            {/* Barra de resultados, paginación y toggle de filtros móvil */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground">
                {totalItems} resultado{totalItems !== 1 ? 's' : ''}
                {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="lg:hidden"
              >
                {mostrarFiltros ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cerrar
                  </>
                ) : (
                  <>
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </>
                )}
              </Button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
                <span className="ml-2 text-muted-foreground">Cargando items...</span>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Error al cargar los items</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            )}

            {/* Grid de items */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemsFiltrados.map((item: MarketItem) => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-gold/30"
                  onClick={() => navigate(`/producto/${item.id}`)}
                >
                  <div className="relative group">
                    <img
                      src={item.imagen}
                      alt={item.titulo}
                      className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/95 hover:bg-background backdrop-blur-sm text-foreground"
                      onClick={(e) => toggleFavorito(e, item.id)}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${
                          favoritosIds.includes(item.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-foreground/70 hover:text-red-500"
                        }`}
                      />
                    </Button>
                    <Badge className="absolute top-2 left-2 bg-background/95 backdrop-blur-sm text-foreground border border-border/50">
                      {RUBROS[item.rubro as keyof typeof RUBROS]?.icon ?? "📦"}{" "}
                      {RUBROS[item.rubro as keyof typeof RUBROS]?.label ?? item.rubro}
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
            )}

            {!isLoading && !error && itemsFiltrados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">
                  {userLocation
                    ? "No hay publicaciones en tu zona. Probá ampliar el radio, elegir otra ubicación, o quitar el filtro para ver todas."
                    : "No se encontraron resultados con los filtros seleccionados"}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {userLocation && (
                    <Button variant="outline" onClick={() => setUserLocation(null)}>
                      Quitar filtro de ubicación
                    </Button>
                  )}
                  <Button variant="outline" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            )}

            {/* Paginación */}
            {!isLoading && !error && itemsFiltrados.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Market;
