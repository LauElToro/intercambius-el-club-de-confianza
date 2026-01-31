import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { marketService, CreateMarketItemData } from "@/services/market.service";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LocationPicker } from "@/components/location/LocationPicker";

// Fichas técnicas por rubro (inspirado en MercadoLibre)
const FICHAS_TECNICAS = {
  productos: {
    categoria: {
      label: "Categoría",
      type: "select",
      options: ["Electrónica", "Ropa", "Hogar", "Deportes", "Libros", "Juguetes", "Otros"],
    },
    estado: {
      label: "Estado",
      type: "select",
      options: ["Nuevo", "Usado - Como nuevo", "Usado - Buen estado", "Usado - Aceptable"],
    },
    marca: {
      label: "Marca",
      type: "text",
    },
    modelo: {
      label: "Modelo",
      type: "text",
    },
    entrega: {
      label: "Forma de entrega",
      type: "select",
      options: ["Retiro", "Envío", "Ambos"],
    },
  },
  servicios: {
    tipo: {
      label: "Tipo de servicio",
      type: "select",
      options: ["Reparaciones", "Limpieza", "Clases", "Consultoría", "Diseño", "Fotografía", "Otros"],
    },
    modalidad: {
      label: "Modalidad",
      type: "select",
      options: ["Presencial", "Online", "Ambos"],
    },
    experiencia: {
      label: "Nivel de experiencia",
      type: "select",
      options: ["Principiante", "Intermedio", "Avanzado", "Profesional"],
    },
    duracion: {
      label: "Duración estimada",
      type: "text",
      placeholder: "Ej: 2 horas, 1 día, etc.",
    },
  },
  alimentos: {
    tipo: {
      label: "Tipo",
      type: "select",
      options: ["Orgánico", "Vegano", "Sin TACC", "Casero", "Artesanal", "Otros"],
    },
    conservacion: {
      label: "Conservación",
      type: "select",
      options: ["Fresco", "Congelado", "Envasado", "Seco"],
    },
    cantidad: {
      label: "Cantidad",
      type: "select",
      options: ["Individual", "Familiar", "Mayorista"],
    },
    fechaVencimiento: {
      label: "Fecha de vencimiento",
      type: "date",
    },
  },
  experiencias: {
    tipo: {
      label: "Tipo de experiencia",
      type: "select",
      options: ["Eventos", "Talleres", "Tours", "Actividades", "Otros"],
    },
    duracion: {
      label: "Duración",
      type: "select",
      options: ["1 hora", "2-4 horas", "Medio día", "Día completo"],
    },
    participantes: {
      label: "Participantes",
      type: "select",
      options: ["Individual", "Pareja", "Grupo pequeño", "Grupo grande"],
    },
    fecha: {
      label: "Fecha disponible",
      type: "date",
    },
  },
};

const CrearProducto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    descripcionCompleta: "",
    precio: "",
    rubro: "" as "" | "servicios" | "productos" | "alimentos" | "experiencias",
    ubicacion: user?.ubicacion || "",
    imagen: null as File | null,
    imagenPreview: "",
    detalles: {} as Record<string, string>,
    caracteristicas: [] as string[],
  });

  const [nuevaCaracteristica, setNuevaCaracteristica] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: CreateMarketItemData) => {
      return await marketService.createItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketItems'] });
      toast({
        title: "¡Producto creado!",
        description: "Tu producto/servicio ya está disponible en el market.",
      });
      navigate("/market");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imagen: file,
        imagenPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imagen) {
      toast({
        title: "Imagen requerida",
        description: "Por favor, subí una imagen de tu producto/servicio",
        variant: "destructive",
      });
      return;
    }

    try {
      // Subir imagen primero
      const uploadResult = await api.upload(formData.imagen);

      // Crear el item
      const itemData: CreateMarketItemData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        descripcionCompleta: formData.descripcionCompleta || undefined,
        precio: parseInt(formData.precio),
        rubro: formData.rubro,
        ubicacion: formData.ubicacion,
        imagen: uploadResult.url,
        detalles: formData.detalles,
        caracteristicas: formData.caracteristicas,
      };

      createMutation.mutate(itemData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive",
      });
    }
  };

  const handleDetalleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      detalles: {
        ...prev.detalles,
        [key]: value,
      },
    }));
  };

  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim()) {
      setFormData(prev => ({
        ...prev,
        caracteristicas: [...prev.caracteristicas, nuevaCaracteristica.trim()],
      }));
      setNuevaCaracteristica("");
    }
  };

  const eliminarCaracteristica = (index: number) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.filter((_, i) => i !== index),
    }));
  };

  const fichaTecnica = formData.rubro ? FICHAS_TECNICAS[formData.rubro] : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear producto o servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información básica</h3>

                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Clases de inglés online"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción corta *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Breve descripción que aparecerá en el listado"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcionCompleta">Descripción completa</Label>
                  <Textarea
                    id="descripcionCompleta"
                    value={formData.descripcionCompleta}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcionCompleta: e.target.value }))}
                    placeholder="Descripción detallada del producto/servicio"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rubro">Rubro *</Label>
                    <Select
                      value={formData.rubro}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, rubro: value, detalles: {} }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rubro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="productos">📦 Productos</SelectItem>
                        <SelectItem value="servicios">🔧 Servicios</SelectItem>
                        <SelectItem value="alimentos">🍎 Alimentos</SelectItem>
                        <SelectItem value="experiencias">🎭 Experiencias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio (IX) *</Label>
                    <Input
                      id="precio"
                      type="number"
                      min="1"
                      value={formData.precio}
                      onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <LocationPicker
                  value={formData.ubicacion}
                  onChange={(location, lat, lng, radius) => {
                    setFormData(prev => ({
                      ...prev,
                      ubicacion: location,
                    }));
                  }}
                  label="Ubicación"
                  required
                />
              </div>

              {/* Imagen */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imagen</h3>
                <div className="space-y-2">
                  <Label htmlFor="imagen">Imagen del producto/servicio *</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="imagen"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label htmlFor="imagen">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Subir imagen
                        </span>
                      </Button>
                    </label>
                    {formData.imagenPreview && (
                      <img
                        src={formData.imagenPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Ficha técnica */}
              {fichaTecnica && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ficha técnica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(fichaTecnica).map(([key, field]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{field.label}</Label>
                        {field.type === "select" ? (
                          <Select
                            value={formData.detalles[key] || ""}
                            onValueChange={(value) => handleDetalleChange(key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === "date" ? (
                          <Input
                            id={key}
                            type="date"
                            value={formData.detalles[key] || ""}
                            onChange={(e) => handleDetalleChange(key, e.target.value)}
                          />
                        ) : (
                          <Input
                            id={key}
                            type="text"
                            value={formData.detalles[key] || ""}
                            onChange={(e) => handleDetalleChange(key, e.target.value)}
                            placeholder={field.placeholder || field.label}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Características */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Características destacadas</h3>
                <div className="flex gap-2">
                  <Input
                    value={nuevaCaracteristica}
                    onChange={(e) => setNuevaCaracteristica(e.target.value)}
                    placeholder="Ej: Incluye materiales, Garantía 6 meses..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarCaracteristica();
                      }
                    }}
                  />
                  <Button type="button" onClick={agregarCaracteristica} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.caracteristicas.map((caracteristica, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-surface rounded">
                      <span>{caracteristica}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarCaracteristica(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creando..." : "Publicar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CrearProducto;
