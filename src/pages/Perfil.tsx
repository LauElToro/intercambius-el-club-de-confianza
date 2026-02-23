import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, ArrowLeft, Loader2, Pencil, Save, X, Instagram, Facebook, Twitter, Linkedin, Globe, Package, Calendar, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { userService } from "@/services/user.service";
import { marketService } from "@/services/market.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { User } from "@/services/auth.service";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

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
  const { formatIX } = useCurrencyVariant();
  const [pageProductos, setPageProductos] = useState(1);
  const PRODUCTOS_POR_PAGINA = 12;

  const { data: usuario, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(Number(id!)),
    enabled: !!id,
  });

  const { data: productosResponse } = useQuery({
    queryKey: ['marketItems', 'perfil', id, pageProductos],
    queryFn: () => marketService.getItems({
      vendedorId: Number(id!),
      page: pageProductos,
      limit: PRODUCTOS_POR_PAGINA,
    }),
    enabled: !!id,
  });

  const productos = productosResponse?.data ?? [];
  const totalProductos = productosResponse?.total ?? 0;
  const totalPagesProductos = productosResponse?.totalPages ?? 1;

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
      ofrece: usuario?.ofrece ?? '',
      necesita: usuario?.necesita ?? '',
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

  useEffect(() => {
    setPageProductos(1);
  }, [id]);

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
        <div className="container mx-auto px-4 py-16 text-center max-w-md mx-auto">
          <div className="rounded-full bg-muted/50 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">Perfil no encontrado</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Este usuario no existe o el enlace puede estar incorrecto.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
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

  const miembroDesdeStr = usuario?.miembroDesde
    ? new Date(usuario.miembroDesde).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
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
        <div className="relative rounded-2xl overflow-hidden bg-muted h-44 sm:h-56 mb-[-3.5rem] shadow-lg">
          {banner ? (
            <img src={banner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold/25 via-gold/10 to-gold/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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

        <Card className="mb-6 shadow-md border-0 shadow-black/5">
          <CardContent className="pt-16 pb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Foto de perfil */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-2 ring-gold/20">
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
                      <label className="text-sm font-medium text-muted-foreground">Lo que busco (para intercambios/permutas)</label>
                      <Textarea
                        value={formData.necesita ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, necesita: e.target.value }))}
                        className="mt-1 min-h-[60px]"
                        placeholder="Ej: Clases de yoga, reparación de celulares, diseño gráfico..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Completá esto para que aparezcan coincidencias entre lo que ofrecés y lo que buscás.
                      </p>
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
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{nombre}</h1>
                      {usuario?.verificado && (
                        <Badge variant="secondary" className="gap-1 bg-gold/10 text-gold border-gold/30">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verificado
                        </Badge>
                      )}
                    </div>
                    {ubicacion && (
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{ubicacion}</span>
                      </div>
                    )}
                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="font-semibold">{Number(usuario?.rating ?? 0).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({usuario?.totalResenas ?? 0} reseñas)
                        </span>
                      </div>
                      {miembroDesdeStr && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Miembro desde {miembroDesdeStr}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span>{totalProductos} publicación{totalProductos !== 1 ? 'es' : ''}</span>
                      </div>
                    </div>
                    {bio && <p className="text-muted-foreground mb-4 leading-relaxed">{bio}</p>}
                    {usuario?.ofrece && (
                      <div className="mb-4 p-4 rounded-xl bg-gold/5 border border-gold/20">
                        <p className="text-xs font-semibold text-gold uppercase tracking-wide mb-1">Lo que ofrece</p>
                        <p className="text-sm text-foreground">{usuario.ofrece}</p>
                      </div>
                    )}
                    {usuario?.necesita && (
                      <div className="mb-4 p-4 rounded-xl bg-muted/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Lo que busca</p>
                        <p className="text-sm text-foreground">{usuario.necesita}</p>
                      </div>
                    )}
                    {Object.keys(redesSociales).length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-4">
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
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-gold/10 text-gold hover:text-gold transition-colors text-sm"
                            >
                              <Icon className="w-4 h-4" />
                              {REDES_LABELS[key]}
                            </a>
                          );
                        })}
                      </div>
                    )}
                    {!esMiPerfil && !user && (
                      <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground mb-3">
                          Iniciá sesión para contactar a este vendedor y coordinar compras o intercambios.
                        </p>
                        <Link to="/login">
                          <Button variant="gold" size="sm">
                            Iniciar sesión para contactar
                          </Button>
                        </Link>
                      </div>
                    )}
                    {!esMiPerfil && user && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Contactá desde el detalle de un producto para hablar antes de comprar.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 shadow-black/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gold" />
              Publicaciones
              <Badge variant="secondary" className="font-normal ml-1">{totalProductos}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productos.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Este usuario aún no tiene publicaciones.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Volvé más adelante para ver novedades.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productos.map((item) => (
                  <Link key={item.id} to={`/producto/${item.id}`}>
                    <Card className="overflow-hidden hover:border-gold/50 hover:shadow-md transition-all cursor-pointer group h-full">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        <img
                          src={item.imagen || "https://via.placeholder.com/300x200"}
                          alt={item.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.rubro && (
                          <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                            {item.rubro}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-2 mb-2">{item.titulo}</h3>
                        <p className="text-gold font-bold text-lg">{formatIX(item.precio)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            {productos.length > 0 && totalPagesProductos > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageProductos((p) => Math.max(1, p - 1))}
                  disabled={pageProductos <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Página {pageProductos} de {totalPagesProductos}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageProductos((p) => Math.min(totalPagesProductos, p + 1))}
                  disabled={pageProductos >= totalPagesProductos}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Perfil;
