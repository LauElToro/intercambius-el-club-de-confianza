import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, ArrowLeft, Loader2, Pencil, Save, X, Instagram, Facebook, Twitter, Linkedin, Globe } from "lucide-react";
import { userService } from "@/services/user.service";
import { marketService } from "@/services/market.service";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/services/auth.service";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const REDES_KEYS = ['instagram', 'facebook', 'twitter', 'linkedin', 'web'] as const;
const REDES_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  web: Globe,
};
const REDES_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  web: 'Sitio web',
};

const Perfil = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const esMiPerfil = user && id && Number(id) === user.id;

  const { data: usuario, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(Number(id!)),
    enabled: !!id,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['marketItems', 'perfil', id],
    queryFn: () => marketService.getItems({ vendedorId: Number(id!) }),
    enabled: !!id && !!usuario,
  });

  const guardarMutation = useMutation({
    mutationFn: (data: Partial<User>) => userService.updateUser(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refreshUser();
      toast({ title: "Perfil actualizado", description: "Los cambios se guardaron correctamente." });
      setEditando(false);
      setFormData({});
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "No se pudo guardar", variant: "destructive" });
    },
  });

  const iniciarEdicion = () => {
    setFormData({
      nombre: usuario?.nombre ?? '',
      bio: usuario?.bio ?? '',
      ubicacion: usuario?.ubicacion ?? '',
      fotoPerfil: usuario?.fotoPerfil ?? '',
      banner: usuario?.banner ?? '',
      redesSociales: usuario?.redesSociales ?? {},
    });
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setFormData({});
  };

  const handleGuardar = () => {
    guardarMutation.mutate(formData);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.upload(file, 'fotoPerfil');
      setFormData((prev) => ({ ...prev, fotoPerfil: result.url }));
    } catch (err: any) {
      toast({ title: "Error al subir foto", description: err.message, variant: "destructive" });
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.upload(file, 'banner');
      setFormData((prev) => ({ ...prev, banner: result.url }));
    } catch (err: any) {
      toast({ title: "Error al subir banner", description: err.message, variant: "destructive" });
    }
  };

  const displayData = editando ? formData : usuario;
  const nombre = displayData?.nombre ?? usuario?.nombre ?? '';
  const bio = displayData?.bio ?? usuario?.bio ?? '';
  const ubicacion = displayData?.ubicacion ?? usuario?.ubicacion ?? '';
  const fotoPerfil = displayData?.fotoPerfil ?? usuario?.fotoPerfil ?? '';
  const banner = displayData?.banner ?? usuario?.banner ?? '';
  const redesSociales = displayData?.redesSociales ?? usuario?.redesSociales ?? {};

  if (isLoading || !usuario) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Perfil no encontrado</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            Volver
          </Button>
        </div>
      </Layout>
    );
  }

  const iniciales = nombre
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          {esMiPerfil && !editando && (
            <Button variant="outline" size="sm" onClick={iniciarEdicion}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar perfil
            </Button>
          )}
          {esMiPerfil && editando && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelarEdicion}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" className="bg-gold" onClick={handleGuardar} disabled={guardarMutation.isPending}>
                {guardarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="relative rounded-xl overflow-hidden bg-muted h-40 sm:h-52 mb-[-3rem]">
          {banner ? (
            <img src={banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gold/20 to-gold/5" />
          )}
          {esMiPerfil && editando && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadBanner}
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2 opacity-90"
                onClick={() => bannerInputRef.current?.click()}
              >
                Cambiar banner
              </Button>
            </>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-16 pb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Foto de perfil */}
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                  {fotoPerfil && <AvatarImage src={fotoPerfil} alt={nombre} />}
                  <AvatarFallback className="text-2xl bg-gold/20 text-gold">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
                {esMiPerfil && editando && (
                  <>
                    <input
                      ref={fotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadFoto}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={() => fotoInputRef.current?.click()}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex-1 w-full">
                {editando ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                      <Input
                        value={formData.nombre ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                      <Input
                        value={formData.ubicacion ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, ubicacion: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bio</label>
                      <Textarea
                        value={formData.bio ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                        className="mt-1 min-h-[80px]"
                        placeholder="Contá sobre vos..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Redes sociales</label>
                      <div className="space-y-2">
                        {REDES_KEYS.map((key) => {
                          const Icon = REDES_ICONS[key];
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder={REDES_LABELS[key]}
                                value={(formData.redesSociales ?? {})[key] ?? ''}
                                onChange={(e) => setFormData((p) => ({
                                  ...p,
                                  redesSociales: { ...(p.redesSociales ?? {}), [key]: e.target.value },
                                }))}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold mb-1">{nombre}</h1>
                    {ubicacion && (
                      <div className="flex items-center gap-1 text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{ubicacion}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{usuario.rating ?? 0}/5</span>
                      <span className="text-sm text-muted-foreground">
                        ({usuario.totalResenas ?? 0} reseñas)
                      </span>
                    </div>
                    {bio && <p className="text-sm text-muted-foreground mb-4">{bio}</p>}
                    {Object.keys(redesSociales).length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {REDES_KEYS.map((key) => {
                          const url = redesSociales[key];
                          if (!url) return null;
                          const Icon = REDES_ICONS[key];
                          const href = url.startsWith('http') ? url : (key === 'web' ? `https://${url}` : url);
                          return (
                            <a
                              key={key}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-gold hover:underline text-sm"
                            >
                              <Icon className="w-4 h-4" />
                              {REDES_LABELS[key]}
                            </a>
                          );
                        })}
                      </div>
                    )}
                    {!esMiPerfil && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Para contactar, comprá o contratá uno de sus productos. Podrás chatear después de la compra.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {productos.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Este usuario aún no tiene publicaciones.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productos.map((item) => (
                  <Link key={item.id} to={`/producto/${item.id}`}>
                    <Card className="overflow-hidden hover:border-gold/50 transition-colors cursor-pointer">
                      <div className="aspect-video bg-muted">
                        <img
                          src={item.imagen || "https://via.placeholder.com/300x200"}
                          alt={item.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium line-clamp-2">{item.titulo}</h3>
                        <p className="text-gold font-bold">{item.precio} IX</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Perfil;
