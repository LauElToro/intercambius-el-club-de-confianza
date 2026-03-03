import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, Upload, Plus, X, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { marketService, CreateMarketItemData } from "@/services/market.service";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LocationPicker } from "@/components/location/LocationPicker";
import { FICHAS_TECNICAS } from "@/lib/fichas-tecnicas";
import { formatPrecioForInput, parsePrecioFromInput } from "@/lib/currency";
import { resolveUbicacionToCoords } from "@/lib/ubicaciones";
import { isImageNsfw } from "@/lib/nsfwCheck";
import { userService } from "@/services/user.service";

const CrearProducto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });
  const usuario = currentUser || user;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    precio: "" as string,
    tiposPago: ["ix"] as ("ix" | "convenir" | "pesos" | "ix_pesos")[],
    rubro: "" as "" | "servicios" | "productos" | "alimentos" | "experiencias",
    ubicacion: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    medias: [] as { file: File; preview: string; type: "image" | "video" }[],
    detalles: {} as Record<string, string>,
    caracteristicas: [] as string[],
  });

  useEffect(() => {
    if (hasInicializadoUbicacion.current) return;
    const ub = usuario?.ubicacion?.trim();
    if (!ub) return;
    hasInicializadoUbicacion.current = true;
    const coords = resolveUbicacionToCoords(ub);
    setFormData((prev) =>
      coords
        ? { ...prev, ubicacion: coords.ubicacion, lat: coords.lat, lng: coords.lng }
        : { ...prev, ubicacion: ub }
    );
  }, [usuario?.ubicacion]);

  const [nuevaCaracteristica, setNuevaCaracteristica] = useState("");
  const [isCheckingMedia, setIsCheckingMedia] = useState(false);
  const hasInicializadoUbicacion = useRef(false);


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
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    setIsCheckingMedia(true);
    try {
      const toAdd: { file: File; preview: string; type: "image" | "video" }[] = [];

      for (const file of files) {
        const type = file.type.startsWith("video/") ? ("video" as const) : ("image" as const);
        const hasVideo = [...formData.medias, ...toAdd].some((m) => m.type === "video");
        const imgCount = [...formData.medias, ...toAdd].filter((m) => m.type === "image").length;

        if (type === "video") {
          if (hasVideo) {
            toast({ title: "Máximo 1 video", variant: "destructive" });
            continue;
          }
          if (imgCount >= 5) {
            toast({ title: "Con video: máx 5 imágenes", variant: "destructive" });
            continue;
          }
        } else {
          if (hasVideo && imgCount >= 5) continue;
          if (!hasVideo && imgCount >= 6) {
            toast({ title: "Máximo 6 imágenes", variant: "destructive" });
            continue;
          }
          try {
            const nsfw = await isImageNsfw(file);
            if (nsfw) {
              toast({
                title: "Imagen no permitida",
                description: "La imagen no cumple con las políticas de contenido de Intercambius.",
                variant: "destructive",
              });
              continue;
            }
          } catch {
            toast({
              title: "Error al verificar la imagen",
              description: "No se pudo procesar. Probá con otra imagen.",
              variant: "destructive",
            });
            continue;
          }
        }
        toAdd.push({ file, preview: URL.createObjectURL(file), type });
      }

      if (toAdd.length > 0) {
        setFormData((prev) => ({ ...prev, medias: [...prev.medias, ...toAdd] }));
      }
    } finally {
      setIsCheckingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setFormData((prev) => {
      const medias = [...prev.medias];
      URL.revokeObjectURL(medias[index].preview);
      medias.splice(index, 1);
      return { ...prev, medias };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || createMutation.isPending) return;

    if (formData.medias.length === 0) {
      toast({
        title: "Imagen o video requerido",
        description: "Subí al menos una foto o un video (máx 6 fotos o 5 fotos + 1 video)",
        variant: "destructive",
      });
      return;
    }

    if (formData.tiposPago.length === 0) {
      toast({
        title: "Forma de intercambio requerida",
        description: "Seleccioná al menos una forma de intercambio aceptada.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploaded: { url: string; mediaType: 'image' | 'video' }[] = [];
      for (let i = 0; i < formData.medias.length; i++) {
        const res = await api.upload(formData.medias[i].file);
        uploaded.push({
          url: res.url,
          mediaType: (res.mediaType as 'image' | 'video') || formData.medias[i].type,
        });
      }

      const firstImage = uploaded.find((u) => u.mediaType === 'image') || uploaded[0];
      const images = uploaded.map((u, i) => ({
        url: u.url,
        position: i,
        isPrimary: i === 0,
        mediaType: u.mediaType,
      }));

      const precioNum = parsePrecioFromInput(formData.precio);
      if (precioNum < 1) {
        toast({ title: "Precio inválido", description: "El precio debe ser al menos 1 IX", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      if (formData.lat == null || formData.lng == null) {
        toast({
          title: "Ubicación requerida",
          description: "Seleccioná una ubicación del mapa (ej: CABA, Córdoba) para que tu publicación aparezca en búsquedas por distancia.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const itemData: CreateMarketItemData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        precio: precioNum,
        tipoPago: formData.tiposPago.length > 0 ? formData.tiposPago.join(",") : "ix",
        rubro: formData.rubro,
        ubicacion: formData.ubicacion,
        lat: formData.lat,
        lng: formData.lng,
        imagen: firstImage.url,
        images,
        detalles: formData.detalles,
        caracteristicas: formData.caracteristicas,
      };

      createMutation.mutate(itemData);
    } catch (error: any) {
      setIsSubmitting(false);
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
                      type="text"
                      inputMode="numeric"
                      value={formatPrecioForInput(formData.precio)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setFormData(prev => ({ ...prev, precio: digits }));
                      }}
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Formas de intercambio aceptadas</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Podés elegir más de una. Si elegís pesos o convenir, acordarán por chat.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { value: "ix" as const, label: "IX (créditos)" },
                        { value: "ix_pesos" as const, label: "IX y pesos (por fuera)" },
                        { value: "convenir" as const, label: "Pago a convenir" },
                        { value: "pesos" as const, label: "Pesos (por fuera)" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.tiposPago.includes(opt.value)}
                            onCheckedChange={(checked) => {
                              setFormData((prev) => ({
                                ...prev,
                                tiposPago: checked
                                  ? [...prev.tiposPago, opt.value]
                                  : prev.tiposPago.filter((t) => t !== opt.value),
                              }));
                            }}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {formData.tiposPago.length === 0 && (
                      <p className="text-xs text-destructive mt-1">
                        Seleccioná al menos una forma de intercambio
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Por defecto se usa tu ubicación de perfil. Cambiala solo si el producto está en otro lugar.
                  </p>
                <LocationPicker
                  value={formData.ubicacion}
                  onChange={(location, lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      ubicacion: location,
                      lat,
                      lng,
                    }));
                  }}
                  label="Ubicación"
                  required
                />
                </div>
              </div>

              {/* Imágenes y video */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imágenes y video</h3>
                <p className="text-sm text-muted-foreground">
                  Mínimo 1 foto o 1 video. Máx 6 fotos, o 5 fotos + 1 video opcional.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Input
                    id="medias"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                  <label htmlFor="medias">
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      disabled={isCheckingMedia}
                    >
                      <span>
                        {isCheckingMedia ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Agregar fotos o video
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  {formData.medias.map((m, i) => (
                    <div key={i} className="relative group">
                      {m.type === 'video' ? (
                        <video src={m.preview} className="w-32 h-32 object-cover rounded-lg" muted playsInline />
                      ) : (
                        <img src={m.preview} alt="" className="w-32 h-32 object-cover rounded-lg" />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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
                  disabled={isSubmitting || createMutation.isPending}
                >
                  {(isSubmitting || createMutation.isPending) ? "Publicando..." : "Publicar"}
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
