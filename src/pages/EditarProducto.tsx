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
import { ArrowLeft, Upload, Plus, X, Loader2 } from "lucide-react";
import { marketService, CreateMarketItemData } from "@/services/market.service";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LocationPicker } from "@/components/location/LocationPicker";
import { formatPrecioForInput, parsePrecioFromInput } from "@/lib/currency";
import { FICHAS_TECNICAS } from "@/lib/fichas-tecnicas";
import { isImageNsfw } from "@/lib/nsfwCheck";
import { resolveUbicacionToCoords } from "@/lib/ubicaciones";
import { userService } from "@/services/user.service";
import { Checkbox } from "@/components/ui/checkbox";

const EditarProducto = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ["marketItem", id],
    queryFn: () => marketService.getItemById(Number(id!)),
    enabled: !!id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });
  const usuario = currentUser || user;

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    tiposPago: ["ix", "pesos", "usd"] as ("ix" | "convenir" | "pesos" | "usd" | "ix_pesos")[],
    aclaracionPago: "",
    rubro: "" as "" | "servicios" | "productos" | "alimentos" | "experiencias",
    ubicacion: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    medias: [] as { file?: File; preview: string; type: 'image' | 'video'; url?: string }[],
    detalles: {} as Record<string, string>,
    caracteristicas: [] as string[],
  });

  const [nuevaCaracteristica, setNuevaCaracteristica] = useState("");
  const [isCheckingMedia, setIsCheckingMedia] = useState(false);

  const tiposValidos = ["ix", "convenir", "pesos", "usd", "ix_pesos"] as const;

  useEffect(() => {
    if (item) {
      const medias =
        item.images && item.images.length > 0
          ? item.images.map((img) => ({
              preview: img.url,
              type: (img.mediaType || "image") as "image" | "video",
              url: img.url,
            }))
          : item.imagen
            ? [{ preview: item.imagen, type: "image" as const, url: item.imagen }]
            : [];
      const tp = item.tipoPago || "ix";
      const tiposPago = tp
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is (typeof tiposValidos)[number] =>
          tiposValidos.includes(s as (typeof tiposValidos)[number])
        );
      const ubicacion = item.ubicacion || usuario?.ubicacion || "";
      const coords =
        !item.lat && !item.lng && ubicacion
          ? resolveUbicacionToCoords(ubicacion)
          : null;
      setFormData({
        titulo: item.titulo || "",
        descripcion: item.descripcion || "",
        precio: String(item.precio || ""),
        tiposPago: tiposPago.length > 0 ? tiposPago : ["ix", "pesos", "usd"],
        aclaracionPago: "",
        rubro: item.rubro || "",
        ubicacion: coords?.ubicacion ?? ubicacion,
        lat: item.lat ?? coords?.lat,
        lng: item.lng ?? coords?.lng,
        medias,
        detalles: item.detalles || {},
        caracteristicas: item.caracteristicas || [],
      });
    }
  }, [item, usuario?.ubicacion]);

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

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    setIsCheckingMedia(true);
    try {
      const toAdd: { file?: File; preview: string; type: "image" | "video"; url?: string }[] = [];

      for (const file of files) {
        const type = file.type.startsWith("video/") ? ("video" as const) : ("image" as const);
        const hasVideo = [...formData.medias, ...toAdd].some((m) => m.type === "video");
        const imgCount = [...formData.medias, ...toAdd].filter((m) => m.type === "image").length;

        if (type === "video" && hasVideo) continue;
        if (type === "video" && imgCount >= 5) continue;
        if (type === "image" && hasVideo && imgCount >= 5) continue;
        if (type === "image" && !hasVideo && imgCount >= 6) continue;

        if (type === "image") {
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
      if (!medias[index].url) URL.revokeObjectURL(medias[index].preview);
      medias.splice(index, 1);
      return { ...prev, medias };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !item) return;
    if (formData.medias.length === 0) {
      toast({ title: "Subí al menos una foto o video", variant: "destructive" });
      return;
    }
    const tiposPagoFinal = formData.tiposPago.length > 0 ? formData.tiposPago : ["ix", "pesos", "usd"];
    const descripcionFinal =
      formData.aclaracionPago?.trim()
        ? `${formData.descripcion}\n\nAclaraciones formas de pago: ${formData.aclaracionPago.trim()}`
        : formData.descripcion;

    try {
      const uploaded: { url: string; mediaType: 'image' | 'video' }[] = [];
      for (let i = 0; i < formData.medias.length; i++) {
        const m = formData.medias[i];
        if (m.url) {
          uploaded.push({ url: m.url, mediaType: m.type });
        } else if (m.file) {
          const res = await api.upload(m.file);
          uploaded.push({ url: res.url, mediaType: (res.mediaType as 'image' | 'video') || m.type });
        }
      }

      const firstImage = uploaded.find((u) => u.mediaType === 'image') || uploaded[0];
      const images = uploaded.map((u, i) => ({
        url: u.url,
        position: i,
        isPrimary: i === 0,
        mediaType: u.mediaType,
      }));

      if (formData.lat == null || formData.lng == null) {
        toast({
          title: "Ubicación requerida",
          description: "Seleccioná una ubicación del mapa (ej: CABA, Córdoba) para que tu publicación aparezca en búsquedas por distancia.",
          variant: "destructive",
        });
        return;
      }

      updateMutation.mutate({
        id: Number(id),
        data: {
          titulo: formData.titulo,
          descripcion: descripcionFinal,
          precio: parsePrecioFromInput(formData.precio),
          tipoPago: tiposPagoFinal.join(","),
          rubro: formData.rubro,
          ubicacion: formData.ubicacion,
          lat: formData.lat,
          lng: formData.lng,
          imagen: firstImage.url,
          images,
          detalles: formData.detalles,
          caracteristicas: formData.caracteristicas,
        },
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error al actualizar", variant: "destructive" });
    }
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
                    <Label>Formas de intercambio que aceptás</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Por defecto aceptás IX, pesos y USD. Desmarcá lo que no quieras aceptar. Es opcional.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { value: "ix" as const, label: "IX (créditos)" },
                        { value: "pesos" as const, label: "Pesos (por fuera)" },
                        { value: "usd" as const, label: "USD (por fuera)" },
                        { value: "ix_pesos" as const, label: "IX y pesos" },
                        { value: "convenir" as const, label: "A convenir" },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
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
                    <Input
                      placeholder="Aclaraciones (opcional). Ej: no acepto USD en efectivo"
                      value={formData.aclaracionPago ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, aclaracionPago: e.target.value }))
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
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
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imágenes y video</h3>
                <p className="text-sm text-muted-foreground">Mín 1 foto o video. Máx 6 fotos o 5 fotos + 1 video.</p>
                <div className="flex flex-wrap gap-4">
                  <Input type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} className="hidden" id="medias" />
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
