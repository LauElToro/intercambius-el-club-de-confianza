import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  MessageCircle, 
  Heart, 
  Share2,
  CheckCircle2,
  Clock,
  User,
  Award
} from "lucide-react";

// Mock data completo - En producción esto vendría de una API
const mockItems = [
  {
    id: 1,
    titulo: "Clases de inglés online",
    descripcion: "Clases personalizadas de inglés para todos los niveles",
    descripcionCompleta: "Ofrezco clases de inglés online personalizadas para estudiantes de todos los niveles. Mi metodología se adapta a tus necesidades específicas, ya sea que busques mejorar tu conversación, prepararte para un examen, o aprender inglés para trabajo.\n\nIncluye:\n- Material de estudio incluido\n- Horarios flexibles\n- Seguimiento personalizado\n- Certificado de finalización\n- Clases de 60 minutos",
    precio: 50,
    rubro: "servicios",
    ubicacion: "Palermo, CABA",
    distancia: 2.5,
    imagen: "https://via.placeholder.com/800x600?text=Clases+Ingles",
    vendedor: {
      nombre: "María García",
      id: 1,
      avatar: "MG",
      rating: 4.8,
      totalResenas: 24,
      miembroDesde: "2023-01-15",
      ubicacion: "Palermo, CABA",
      verificado: true
    },
    detalles: {
      tipo: "Clases",
      modalidad: "Online",
      experiencia: "Profesional",
      duracion: "60 minutos",
      disponibilidad: "Lunes a Viernes, 9:00 - 20:00"
    },
    caracteristicas: [
      "Material incluido",
      "Horarios flexibles",
      "Certificado de finalización",
      "Seguimiento personalizado"
    ]
  },
  {
    id: 2,
    titulo: "Reparación de computadoras",
    descripcion: "Servicio técnico profesional para PC y notebooks",
    descripcionCompleta: "Servicio técnico profesional especializado en reparación de computadoras y notebooks. Más de 10 años de experiencia en el rubro.\n\nServicios:\n- Diagnóstico gratuito\n- Reparación de hardware\n- Instalación de software\n- Limpieza y mantenimiento\n- Recuperación de datos\n- Actualización de componentes",
    precio: 80,
    rubro: "servicios",
    ubicacion: "Belgrano, CABA",
    distancia: 5.2,
    imagen: "https://via.placeholder.com/800x600?text=Reparacion+PC",
    vendedor: {
      nombre: "Carlos Rodríguez",
      id: 2,
      avatar: "CR",
      rating: 4.9,
      totalResenas: 45,
      miembroDesde: "2022-08-20",
      ubicacion: "Belgrano, CABA",
      verificado: true
    },
    detalles: {
      tipo: "Reparaciones",
      modalidad: "Presencial",
      experiencia: "Profesional",
      tiempoEstimado: "2-4 horas",
      garantia: "30 días"
    },
    caracteristicas: [
      "Diagnóstico gratuito",
      "Garantía de 30 días",
      "Atención en el día",
      "Más de 10 años de experiencia"
    ]
  },
  {
    id: 3,
    titulo: "Pan casero artesanal",
    descripcion: "Pan de masa madre, hecho a mano con ingredientes orgánicos",
    descripcionCompleta: "Pan de masa madre artesanal, hecho a mano con ingredientes 100% orgánicos. Receta tradicional que se transmite de generación en generación.\n\nCaracterísticas:\n- Ingredientes orgánicos certificados\n- Sin conservantes\n- Masa madre natural\n- Horneado diario\n- Disponible en varios formatos",
    precio: 30,
    rubro: "alimentos",
    ubicacion: "Villa Crespo, CABA",
    distancia: 3.8,
    imagen: "https://via.placeholder.com/800x600?text=Pan+Casero",
    vendedor: {
      nombre: "Panadería Don José",
      id: 3,
      avatar: "DJ",
      rating: 5.0,
      totalResenas: 67,
      miembroDesde: "2021-03-10",
      ubicacion: "Villa Crespo, CABA",
      verificado: true
    },
    detalles: {
      tipo: "Artesanal",
      conservacion: "Fresco",
      cantidad: "Familiar",
      ingredientes: "100% orgánicos",
      sinConservantes: "Sí"
    },
    caracteristicas: [
      "Ingredientes orgánicos",
      "Sin conservantes",
      "Masa madre natural",
      "Horneado diario"
    ]
  },
  {
    id: 4,
    titulo: "Diseño de logos",
    descripcion: "Diseño profesional de identidad visual para tu marca",
    descripcionCompleta: "Servicio profesional de diseño de logos e identidad visual para tu marca o emprendimiento. Trabajo con múltiples revisiones hasta lograr el diseño perfecto.\n\nIncluye:\n- 3 propuestas iniciales\n- Hasta 5 revisiones\n- Archivos en múltiples formatos\n- Guía de uso de marca\n- Versiones en color y blanco/negro",
    precio: 120,
    rubro: "servicios",
    ubicacion: "San Telmo, CABA",
    distancia: 7.1,
    imagen: "https://via.placeholder.com/800x600?text=Diseño+Logo",
    vendedor: {
      nombre: "Ana Fernández",
      id: 4,
      avatar: "AF",
      rating: 4.7,
      totalResenas: 18,
      miembroDesde: "2023-06-05",
      ubicacion: "San Telmo, CABA",
      verificado: true
    },
    detalles: {
      tipo: "Diseño",
      modalidad: "Online",
      experiencia: "Profesional",
      entregables: "Logo + Guía de marca",
      tiempoEstimado: "7-10 días"
    },
    caracteristicas: [
      "3 propuestas iniciales",
      "Hasta 5 revisiones",
      "Múltiples formatos",
      "Guía de uso de marca"
    ]
  },
  {
    id: 5,
    titulo: "Bicicleta usada",
    descripcion: "Bicicleta de montaña en excelente estado, solo 2 años de uso",
    descripcionCompleta: "Bicicleta de montaña marca Trek, modelo X-Caliber 8, año 2022. En excelente estado, solo 2 años de uso. Perfectamente mantenida.\n\nCaracterísticas:\n- Cuadro de aluminio\n- Suspensión delantera\n- 21 velocidades\n- Frenos de disco\n- Ruedas 29 pulgadas\n- Incluye: candado, bomba de aire, kit de herramientas",
    precio: 200,
    rubro: "productos",
    ubicacion: "Caballito, CABA",
    distancia: 4.3,
    imagen: "https://via.placeholder.com/800x600?text=Bicicleta",
    vendedor: {
      nombre: "Pedro Gómez",
      id: 5,
      avatar: "PG",
      rating: 4.6,
      totalResenas: 12,
      miembroDesde: "2023-05-10",
      ubicacion: "Caballito, CABA",
      verificado: false
    },
    detalles: {
      categoria: "Deportes",
      estado: "Usado - Como nuevo",
      entrega: "Retiro",
      marca: "Trek",
      modelo: "X-Caliber 8",
      año: 2022
    },
    caracteristicas: [
      "Cuadro de aluminio",
      "Suspensión delantera",
      "21 velocidades",
      "Frenos de disco",
      "Ruedas 29 pulgadas"
    ]
  },
  {
    id: 6,
    titulo: "Taller de yoga",
    descripcion: "Clases grupales de yoga y meditación en parque",
    descripcionCompleta: "Talleres grupales de yoga y meditación al aire libre en el parque. Ideal para principiantes y personas que buscan relajación y bienestar.\n\nIncluye:\n- Clases de 60 minutos\n- Mat de yoga incluido\n- Técnicas de respiración\n- Meditación guiada\n- Ambiente relajante en la naturaleza",
    precio: 40,
    rubro: "experiencias",
    ubicacion: "Palermo, CABA",
    distancia: 2.1,
    imagen: "https://via.placeholder.com/800x600?text=Yoga",
    vendedor: {
      nombre: "Sofía López",
      id: 6,
      avatar: "SL",
      rating: 4.9,
      totalResenas: 31,
      miembroDesde: "2022-11-15",
      ubicacion: "Palermo, CABA",
      verificado: true
    },
    detalles: {
      tipo: "Talleres",
      duracion: "1 hora",
      participantes: "Grupo pequeño",
      ubicacion: "Parque",
      nivel: "Todos los niveles"
    },
    caracteristicas: [
      "Al aire libre",
      "Mat incluido",
      "Técnicas de respiración",
      "Meditación guiada"
    ]
  },
  {
    id: 7,
    titulo: "Fotografía de eventos",
    descripcion: "Servicio profesional de fotografía para eventos sociales",
    descripcionCompleta: "Servicio profesional de fotografía para eventos sociales: casamientos, cumpleaños, fiestas, etc. Equipamiento profesional y edición incluida.\n\nIncluye:\n- Sesión completa del evento\n- Edición profesional\n- Entrega digital en alta resolución\n- Album físico opcional\n- Hasta 200 fotos editadas",
    precio: 150,
    rubro: "servicios",
    ubicacion: "Recoleta, CABA",
    distancia: 6.5,
    imagen: "https://via.placeholder.com/800x600?text=Fotografia",
    vendedor: {
      nombre: "Laura Martínez",
      id: 7,
      avatar: "LM",
      rating: 5.0,
      totalResenas: 52,
      miembroDesde: "2021-09-20",
      ubicacion: "Recoleta, CABA",
      verificado: true
    },
    detalles: {
      tipo: "Fotografía",
      modalidad: "Presencial",
      experiencia: "Profesional",
      entrega: "7-10 días",
      formato: "Digital + Físico opcional"
    },
    caracteristicas: [
      "Equipamiento profesional",
      "Edición incluida",
      "Alta resolución",
      "Album físico opcional"
    ]
  },
  {
    id: 8,
    titulo: "Muebles de madera reciclada",
    descripcion: "Muebles únicos hechos con madera reciclada, diseño moderno",
    descripcionCompleta: "Muebles únicos y ecológicos hechos con madera reciclada. Diseño moderno y funcional, perfectos para cualquier espacio.\n\nCaracterísticas:\n- Madera 100% reciclada\n- Diseño personalizado\n- Acabado profesional\n- Resistente y duradero\n- Opciones de color disponibles",
    precio: 300,
    rubro: "productos",
    ubicacion: "Villa Urquiza, CABA",
    distancia: 8.2,
    imagen: "https://via.placeholder.com/800x600?text=Muebles",
    vendedor: {
      nombre: "Eco Muebles",
      id: 8,
      avatar: "EM",
      rating: 4.8,
      totalResenas: 28,
      miembroDesde: "2022-04-12",
      ubicacion: "Villa Urquiza, CABA",
      verificado: true
    },
    detalles: {
      categoria: "Hogar",
      estado: "Nuevo",
      entrega: "Ambos",
      material: "Madera reciclada",
      personalizacion: "Sí"
    },
    caracteristicas: [
      "100% reciclado",
      "Diseño personalizado",
      "Acabado profesional",
      "Resistente y duradero"
    ]
  }
];

const ProductoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = mockItems.find(i => i.id === Number(id));

  if (!item) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Button onClick={() => navigate("/market")}>
            Volver al Market
          </Button>
        </div>
      </Layout>
    );
  }

  const { vendedor } = item;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Botón volver */}
        <Button
          variant="ghost"
          onClick={() => navigate("/market")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal - Imagen y descripción */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagen principal */}
            <Card>
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <img
                  src={item.imagen}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>

            {/* Información del producto */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>
                        {item.rubro === "servicios" ? "🔧 Servicio" : 
                         item.rubro === "productos" ? "📦 Producto" :
                         item.rubro === "alimentos" ? "🍎 Alimento" : "🎭 Experiencia"}
                      </Badge>
                      {item.precio && (
                        <span className="text-3xl font-bold gold-text">
                          {item.precio} IX
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl mb-2">{item.titulo}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{item.ubicacion}</span>
                      <span>•</span>
                      <span>{item.distancia} km de distancia</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Descripción */}
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {item.descripcionCompleta || item.descripcion}
                  </p>
                </div>

                <Separator />

                {/* Características */}
                {item.caracteristicas && item.caracteristicas.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Características</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {item.caracteristicas.map((caracteristica, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-gold" />
                          <span>{caracteristica}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Detalles específicos */}
                <div>
                  <h3 className="font-semibold mb-3">Detalles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(item.detalles).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <p className="font-medium">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Vendedor y acciones */}
          <div className="space-y-6">
            {/* Card del vendedor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publicado por</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-gold/20 text-gold">
                      {vendedor.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{vendedor.nombre}</h3>
                      {vendedor.verificado && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{vendedor.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({vendedor.totalResenas} reseñas)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>{vendedor.ubicacion}</span>
                    </div>
                    <Link to={`/perfil/${vendedor.id}`}>
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Ver perfil
                      </Button>
                    </Link>
                  </div>
                </div>

                <Separator />

                {/* Reputación */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Reputación</span>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-gold" />
                      <span className="font-semibold">{vendedor.rating}/5.0</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Miembro desde</span>
                      <span>{new Date(vendedor.miembroDesde).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total de reseñas</span>
                      <span>{vendedor.totalResenas}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full bg-gold hover:bg-gold/90 text-primary-foreground" size="lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contactar vendedor
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Hacer una oferta
                </Button>
                <div className="text-xs text-center text-muted-foreground pt-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Publicado hace 2 días
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductoDetalle;
