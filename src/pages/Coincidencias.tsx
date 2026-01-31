import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, MapPin, MessageCircle, Heart, AlertCircle, Loader2 } from "lucide-react";
import { convertIXToPesos, LIMITE_CREDITO_NEGATIVO_PESOS, formatCurrency } from "@/lib/currency";
import { useAuth } from "@/contexts/AuthContext";
import { coincidenciasService } from "@/services/coincidencias.service";
import { MarketItem } from "@/services/market.service";
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
];

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

  // Obtener coincidencias del backend
  const { data: coincidencias = [], isLoading, error } = useQuery({
    queryKey: ['coincidencias', user?.id],
    queryFn: () => coincidenciasService.getCoincidencias(user!.id),
    enabled: !!user?.id,
  });

  const toggleFavorito = (id: number) => {
    setFavoritos(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </Layout>
    );
  }

  const saldoEnPesos = convertIXToPesos(user.saldo);
  const puedeComprar = saldoEnPesos > -LIMITE_CREDITO_NEGATIVO_PESOS;

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
              Has alcanzado el límite de crédito negativo ({formatCurrency(LIMITE_CREDITO_NEGATIVO_PESOS, 'ARS')}). 
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
                {formatCurrency(user.saldo)} 
                <span className="text-sm text-muted-foreground ml-2">
                  (Límite: {formatCurrency(-LIMITE_CREDITO_NEGATIVO_PESOS, 'ARS')})
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
        {coincidencias.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coincidencias.map(item => (
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
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              No encontramos coincidencias con el valor de tu oferta
            </p>
            <p className="text-sm text-muted-foreground">
              {coincidencias.length === 0 
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
