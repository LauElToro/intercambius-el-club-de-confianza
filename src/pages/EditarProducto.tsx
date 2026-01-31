import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

import { FICHAS_TECNICAS } from "@/lib/fichas-tecnicas";

const EditarProducto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ['marketItem', id],
    queryFn: () => marketService.getItemById(Number(id!)),
    enabled: !!id,
  });

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    rubro: "" as "" | "servicios" | "productos" | "alimentos" | "experiencias",
    ubicacion: user?.ubicacion || "",
    imagen: null as File | null,
    imagenPreview: "",
    detalles: {} as Record<string, string>,
    caracteristicas: [] as string[],
  });

  const [nuevaCaracteristica, setNuevaCaracteristica] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({
        titulo: item.titulo || "",
        descripcion: item.descripcion || "",
        precio: String(item.precio || ""),
        rubro: item.rubro || "",
        ubicacion: item.ubicacion || user?.ubicacion || "",
        imagen: null,
        imagenPreview: item.imagen || "",
        detalles: item.detalles || {},
        caracteristicas: item.caracteristicas || [],
      });
    }
  }, [item, user?.ubicacion]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMarketItemData> & { imagen?: string } }) =>
      marketService.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketItems'] });
      toast({
        title: "¡Producto actualizado!",
        description: "Los cambios se guardaron correctamente.",
      });
      navigate("/mis-publicaciones");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar",
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
    if (!id || !item) return;

    let imagenUrl = item.imagen;
    if (formData.imagen) {
      try {
        const uploadResult = await api.upload(formData.imagen);
        imagenUrl = uploadResult.url;
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Error al subir imagen", variant: "destructive" });
        return;
      }
    }

    updateMutation.mutate({
      id: Number(id),
      data: {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: parseInt(formData.precio),
        rubro: formData.rubro,
        ubicacion: formData.ubicacion,
        imagen: imagenUrl,
        detalles: formData.detalles,
        caracteristicas: formData.caracteristicas,
      },
    });
  };

  const handleDetalleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      detalles: { ...prev.detalles, [key]: value },
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

  if (isLoading || !item) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
        </div>
      </Layout>
    );
  }

  if (item.vendedorId !== user?.id) {
    toast({ title: "No autorizado", description: "No podés editar esta publicación", variant: "destructive" });
    navigate("/mis-publicaciones");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Editar producto o servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción del producto o servicio"
                    rows={5}
                    required
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
                  onChange={(location) => setFormData(prev => ({ ...prev, ubicacion: location }))}
                  label="Ubicación"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imagen</h3>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="imagen" />
                  <label htmlFor="imagen">
                    <Button type="button" variant="outline" asChild>
                      <span><Upload className="w-4 h-4 mr-2" />Cambiar imagen</span>
                    </Button>
                  </label>
                  {formData.imagenPreview && (
                    <img src={formData.imagenPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                  )}
                </div>
              </div>

              {fichaTecnica && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ficha técnica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(fichaTecnica).map(([key, field]) => (
                      <div key={key} className="space-y-2">
                        <Label>{field.label}</Label>
                        {field.type === "select" ? (
                          <Select
                            value={formData.detalles[key] || ""}
                            onValueChange={(value) => handleDetalleChange(key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {(field.options || []).map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === "date" ? (
                          <Input
                            type="date"
                            value={formData.detalles[key] || ""}
                            onChange={(e) => handleDetalleChange(key, e.target.value)}
                          />
                        ) : (
                          <Input
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Características</h3>
                <div className="flex gap-2">
                  <Input
                    value={nuevaCaracteristica}
                    onChange={(e) => setNuevaCaracteristica(e.target.value)}
                    placeholder="Ej: Incluye materiales..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), agregarCaracteristica())}
                  />
                  <Button type="button" onClick={agregarCaracteristica} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.caracteristicas.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-surface rounded">
                      <span>{c}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => eliminarCaracteristica(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" variant="gold" className="flex-1" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditarProducto;
