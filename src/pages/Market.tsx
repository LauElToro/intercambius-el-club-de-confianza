import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
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
  ChevronUp
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

// Mock data de productos/servicios
const mockItems = [
  {
    id: 1,
    titulo: "Clases de inglés online",
    descripcion: "Clases personalizadas de inglés para todos los niveles",
    precio: 50,
    rubro: "servicios",
    ubicacion: "Palermo, CABA",
    distancia: 2.5,
    imagen: "https://via.placeholder.com/300x200?text=Clases+Ingles",
    vendedor: "María García",
    rating: 4.8,
    favorito: false,
    detalles: {
      tipo: "Clases",
      modalidad: "Online",
      experiencia: "Profesional"
    }
  },
  {
    id: 2,
    titulo: "Reparación de computadoras",
    descripcion: "Servicio técnico profesional para PC y notebooks",
    precio: 80,
    rubro: "servicios",
    ubicacion: "Belgrano, CABA",
    distancia: 5.2,
    imagen: "https://via.placeholder.com/300x200?text=Reparacion+PC",
    vendedor: "Carlos Rodríguez",
    rating: 4.9,
    favorito: true,
    detalles: {
      tipo: "Reparaciones",
      modalidad: "Presencial",
      experiencia: "Profesional"
    }
  },
  {
    id: 3,
    titulo: "Pan casero artesanal",
    descripcion: "Pan de masa madre, hecho a mano con ingredientes orgánicos",
    precio: 30,
    rubro: "alimentos",
    ubicacion: "Villa Crespo, CABA",
    distancia: 3.8,
    imagen: "https://via.placeholder.com/300x200?text=Pan+Casero",
    vendedor: "Panadería Don José",
    rating: 5.0,
    favorito: false,
    detalles: {
      tipo: "Artesanal",
      conservacion: "Fresco",
      cantidad: "Familiar"
    }
  },
  {
    id: 4,
    titulo: "Diseño de logos",
    descripcion: "Diseño profesional de identidad visual para tu marca",
    precio: 120,
    rubro: "servicios",
    ubicacion: "San Telmo, CABA",
    distancia: 7.1,
    imagen: "https://via.placeholder.com/300x200?text=Diseño+Logo",
    vendedor: "Ana Fernández",
    rating: 4.7,
    favorito: false,
    detalles: {
      tipo: "Diseño",
      modalidad: "Online",
      experiencia: "Profesional"
    }
  },
  {
    id: 5,
    titulo: "Bicicleta usada",
    descripcion: "Bicicleta de montaña en excelente estado, solo 2 años de uso",
    precio: 200,
    rubro: "productos",
    ubicacion: "Caballito, CABA",
    distancia: 4.3,
    imagen: "https://via.placeholder.com/300x200?text=Bicicleta",
    vendedor: "Pedro Gómez",
    rating: 4.6,
    favorito: false,
    detalles: {
      categoria: "Deportes",
      estado: "Usado - Como nuevo",
      entrega: "Retiro"
    }
  },
  {
    id: 6,
    titulo: "Taller de yoga",
    descripcion: "Clases grupales de yoga y meditación en parque",
    precio: 40,
    rubro: "experiencias",
    ubicacion: "Palermo, CABA",
    distancia: 2.1,
    imagen: "https://via.placeholder.com/300x200?text=Yoga",
    vendedor: "Sofía López",
    rating: 4.9,
    favorito: true,
    detalles: {
      tipo: "Talleres",
      duracion: "1 hora",
      participantes: "Grupo pequeño"
    }
  },
  {
    id: 7,
    titulo: "Fotografía de eventos",
    descripcion: "Servicio profesional de fotografía para eventos sociales",
    precio: 150,
    rubro: "servicios",
    ubicacion: "Recoleta, CABA",
    distancia: 6.5,
    imagen: "https://via.placeholder.com/300x200?text=Fotografia",
    vendedor: "Laura Martínez",
    rating: 5.0,
    favorito: false,
    detalles: {
      tipo: "Fotografía",
      modalidad: "Presencial",
      experiencia: "Profesional"
    }
  },
  {
    id: 8,
    titulo: "Muebles de madera reciclada",
    descripcion: "Muebles únicos hechos con madera reciclada, diseño moderno",
    precio: 300,
    rubro: "productos",
    ubicacion: "Villa Urquiza, CABA",
    distancia: 8.2,
    imagen: "https://via.placeholder.com/300x200?text=Muebles",
    vendedor: "Eco Muebles",
    rating: 4.8,
    favorito: false,
    detalles: {
      categoria: "Hogar",
      estado: "Nuevo",
      entrega: "Ambos"
    }
  }
];

const Market = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState<"todos" | "productos" | "servicios">("todos");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string>("todos");
  const [distanciaMax, setDistanciaMax] = useState([20]);
  const [precioMin, setPrecioMin] = useState([0]);
  const [precioMax, setPrecioMax] = useState([500]);
  const [filtrosRubro, setFiltrosRubro] = useState<Record<string, string[]>>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [favoritos, setFavoritos] = useState<number[]>([2, 6]);

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

  // Filtrar items
  const itemsFiltrados = useMemo(() => {
    return mockItems.filter(item => {
      // Búsqueda por texto
      if (search && !item.titulo.toLowerCase().includes(search.toLowerCase()) &&
          !item.descripcion.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      // Filtro por tipo (productos/servicios)
      if (tipoSeleccionado !== "todos") {
        const esProducto = item.rubro === "productos" || item.rubro === "alimentos";
        const esServicio = item.rubro === "servicios" || item.rubro === "experiencias";
        if (tipoSeleccionado === "productos" && !esProducto) return false;
        if (tipoSeleccionado === "servicios" && !esServicio) return false;
      }

      // Filtro por rubro
      if (rubroSeleccionado !== "todos" && item.rubro !== rubroSeleccionado) {
        return false;
      }

      // Filtro por distancia
      if (item.distancia > distanciaMax[0]) {
        return false;
      }

      // Filtro por precio
      if (item.precio < precioMin[0] || item.precio > precioMax[0]) {
        return false;
      }

      // Filtros específicos del rubro
      if (filtrosDisponibles && item.detalles) {
        for (const [categoria, valores] of Object.entries(filtrosRubro)) {
          if (valores.length > 0) {
            const valorItem = item.detalles[categoria as keyof typeof item.detalles];
            if (!valorItem || !valores.includes(valorItem as string)) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [search, tipoSeleccionado, rubroSeleccionado, distanciaMax, precioMin, precioMax, filtrosRubro, filtrosDisponibles]);

  const toggleFavorito = (id: number) => {
    setFavoritos(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const limpiarFiltros = () => {
    setSearch("");
    setTipoSeleccionado("todos");
    setRubroSeleccionado("todos");
    setDistanciaMax([20]);
    setPrecioMin([0]);
    setPrecioMax([500]);
    setFiltrosRubro({});
  };

  const tieneFiltrosActivos = search || tipoSeleccionado !== "todos" || rubroSeleccionado !== "todos" || 
    distanciaMax[0] < 20 || precioMin[0] > 0 || precioMax[0] < 500 ||
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
                    {/* Búsqueda */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Buscar</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar productos o servicios..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
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
                        Distancia máxima: {distanciaMax[0]} km
                      </label>
                      <Slider
                        value={distanciaMax}
                        onValueChange={setDistanciaMax}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 km</span>
                        <span>50 km</span>
                      </div>
                    </div>

                    {/* Precio */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Precio (IX)</label>
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
                            {precioMin[0]} IX
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Máximo</label>
                          <Slider
                            value={precioMax}
                            onValueChange={setPrecioMax}
                            max={1000}
                            min={precioMin[0] + 10}
                            step={10}
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {precioMax[0]} IX
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
            {/* Barra de resultados y toggle de filtros móvil */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {itemsFiltrados.length} resultado{itemsFiltrados.length !== 1 ? 's' : ''}
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

            {/* Grid de items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsFiltrados.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border hover:border-gold/30"
                  onClick={() => navigate(`/market/${item.id}`)}
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
                        {item.precio} IX
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
                      <span className="flex-shrink-0">{item.distancia} km</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{item.rating}</span>
                        <span className="text-muted-foreground truncate max-w-[100px]">
                          {item.vendedor}
                        </span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-gold hover:bg-gold/90 text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/market/${item.id}`);
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

            {itemsFiltrados.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No se encontraron resultados con los filtros seleccionados
                </p>
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar filtros
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
