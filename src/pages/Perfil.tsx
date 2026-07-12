import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Star, ArrowLeft, Loader2, Pencil, Save, X, Instagram, Facebook, Twitter, Linkedin, Globe, Package, Calendar, BadgeCheck, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { userService } from "@/services/user.service";
import { marketService } from "@/services/market.service";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { User } from "@/services/auth.service";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { IdentidadVerificadaBadge } from "@/components/kyc/IdentidadVerificadaBadge";
import { kycService } from "@/services/kyc.service";
import { OfertaCreditoTerminos, getCreditoAceptado } from "@/components/credito/OfertaCreditoTerminos";
import { LoQueBuscoEditor } from "@/components/coincidencias/LoQueBuscoEditor";
import { nombrePublico, nombreTiendaParaAsignar, sanitizeProfileSlugInput } from "@/lib/perfil";

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
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [kycBtnLoading, setKycBtnLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [interesInput, setInteresInput] = useState("");
  const [showOfertaCredito, setShowOfertaCredito] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { formatIX } = useCurrencyVariant();
  const [pageProductos, setPageProductos] = useState(1);
  const PRODUCTOS_POR_PAGINA = 12;
  const asignandoNombreTiendaRef = useRef(false);

  const { data: usuario, isLoading, error } = useQuery({
    queryKey: ['user', idOrSlug],
    queryFn: () => userService.getUser(idOrSlug!),
    enabled: !!idOrSlug,
  });

  const esMiPerfil = Boolean(user && usuario && user.id === usuario.id);

  const { data: productosResponse } = useQuery({
    queryKey: ['marketItems', 'perfil', usuario?.id, pageProductos],
    queryFn: () => marketService.getItems({
      vendedorId: usuario!.id,
      page: pageProductos,
      limit: PRODUCTOS_POR_PAGINA,
    }),
    enabled: !!usuario?.id,
  });

  const productos = productosResponse?.data ?? [];
  const totalProductos = productosResponse?.total ?? 0;
  const totalPagesProductos = productosResponse?.totalPages ?? 1;

  const guardarMutation = useMutation({
    mutationFn: (data: Partial<User>) => userService.updateUser(data),
    onSuccess: async (_saved, variables) => {
      const newSlug = variables.profileSlug?.trim() || usuario?.profileSlug;
      queryClient.invalidateQueries({ queryKey: ['user', idOrSlug] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['coincidencias'] });
      await refreshUser();
      toast({ title: "Perfil actualizado", description: "Los cambios se guardaron correctamente." });
      setEditando(false);
      setFormData({});
      if (newSlug && newSlug !== idOrSlug) {
        navigate(`/perfil/${newSlug}`, { replace: true });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "No se pudo guardar", variant: "destructive" });
    },
  });

  const iniciarEdicion = useCallback(() => {
    setFormData({
      nombre: usuario?.nombre ?? '',
      nombreTienda: usuario?.nombreTienda?.trim() || usuario?.nombre || '',
      profileSlug: usuario?.profileSlug ?? '',
      bio: usuario?.bio ?? '',
      ubicacion: usuario?.ubicacion ?? '',
      fotoPerfil: usuario?.fotoPerfil ?? '',
      banner: usuario?.banner ?? '',
      redesSociales: usuario?.redesSociales ?? {},
      ofrece: usuario?.ofrece ?? '',
      necesita: usuario?.necesita ?? '',
      interesesQuiero: [...(usuario?.interesesQuiero ?? [])],
    });
    setInteresInput("");
    setEditando(true);
  }, [usuario]);

  const scrollALoQueQuiero = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("config-lo-que-quiero")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    });
  };

  const abrirEdicionLoQueQuiero = () => {
    iniciarEdicion();
    scrollALoQueQuiero();
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setFormData({});
    setInteresInput("");
  };

  const agregarInteres = () => {
    const raw = interesInput.trim().slice(0, 80);
    if (raw.length < 2) return;
    const lista = [...(formData.interesesQuiero ?? [])];
    const duplicado = lista.some((t) => t.toLowerCase() === raw.toLowerCase());
    if (duplicado) {
      setInteresInput("");
      return;
    }
    if (lista.length >= 25) return;
    lista.push(raw);
    setFormData((p) => ({ ...p, interesesQuiero: lista }));
    setInteresInput("");
  };

  const quitarInteres = (tag: string) => {
    setFormData((p) => ({
      ...p,
      interesesQuiero: (p.interesesQuiero ?? []).filter((t) => t !== tag),
    }));
  };

  const handleGuardar = () => {
    const payload: Partial<User> = { ...formData };
    if (formData.profileSlug != null) {
      payload.profileSlug = sanitizeProfileSlugInput(String(formData.profileSlug));
    }
    if ('nombreTienda' in formData) {
      payload.nombreTienda = String(formData.nombreTienda ?? '').trim() || null;
    }
    guardarMutation.mutate(payload);
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
  }, [idOrSlug]);

  /** Asigna nombre de tienda (= nombre de cuenta) a quien no lo tenga. */
  useEffect(() => {
    if (!esMiPerfil || !usuario || asignandoNombreTiendaRef.current) return;
    const nombreTienda = nombreTiendaParaAsignar(usuario);
    if (!nombreTienda) return;

    asignandoNombreTiendaRef.current = true;
    void userService
      .updateUser({ nombreTienda })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['user', idOrSlug] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        void refreshUser();
      })
      .catch(() => {
        asignandoNombreTiendaRef.current = false;
      });
  }, [esMiPerfil, usuario, idOrSlug, queryClient, refreshUser]);

  const kycReturn = searchParams.get("kyc");
  useEffect(() => {
    if (!esMiPerfil || kycReturn !== "return") return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await kycService.syncFromDidit();
        if (!cancelled && r.kycVerificado) {
          toast({ title: "Identidad verificada", description: "Ya podés comprar con IOX y usar intercambios." });
        } else if (!cancelled && r.pending) {
          toast({
            title: "Verificación en proceso",
            description: "Didit aún no marca el resultado como aprobado. Podés reintentar en unos minutos.",
          });
        }
      } catch {
        // seguir con refresh
      } finally {
        if (!cancelled) {
          await refreshUser();
          queryClient.invalidateQueries({ queryKey: ["user", idOrSlug] });
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          setSearchParams({}, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [esMiPerfil, kycReturn, setSearchParams, refreshUser, queryClient, idOrSlug, toast]);

  /** Desde Coincidencias: `/perfil/:slug?intereses=1` abre edición y baja a "Lo que quiero". */
  useEffect(() => {
    if (!usuario || !esMiPerfil || !idOrSlug) return;
    if (/^\d+$/.test(idOrSlug) && usuario.profileSlug) {
      const q = searchParams.toString();
      navigate(`/perfil/${usuario.profileSlug}${q ? `?${q}` : ''}`, { replace: true });
    }
  }, [usuario, esMiPerfil, idOrSlug, navigate, searchParams]);

  useEffect(() => {
    if (!usuario || !esMiPerfil) return;
    if (searchParams.get("intereses") !== "1") return;
    iniciarEdicion();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("intereses");
      return next;
    }, { replace: true });
    const t = window.setTimeout(() => {
      document.getElementById("config-lo-que-quiero")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 280);
    return () => window.clearTimeout(t);
  }, [usuario, esMiPerfil, searchParams, setSearchParams, iniciarEdicion]);

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

  const displayData = editando ? formData : usuario;
  const nombreMostrar = editando
    ? (formData.nombreTienda?.trim() || formData.nombre || usuario.nombre || '')
    : nombrePublico(usuario);
  const bio = displayData?.bio ?? usuario.bio ?? '';
  const ubicacion = displayData?.ubicacion ?? usuario.ubicacion ?? '';
  const fotoPerfil = displayData?.fotoPerfil ?? usuario.fotoPerfil ?? '';
  const banner = displayData?.banner ?? usuario.banner ?? '';
  const redesSociales = displayData?.redesSociales ?? usuario.redesSociales ?? {};

  const iniciales = nombreMostrar
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

        {esMiPerfil && !editando && user?.id && getCreditoAceptado(user.id) !== "aceptado" && (
          <div className="mb-4 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Crédito IOX</p>
              <p className="text-sm text-muted-foreground">
                {getCreditoAceptado(user.id) === "rechazado"
                  ? "Elegiste operar solo con dinero tradicional. Podés activar IOX cuando quieras."
                  : "Activá el crédito IOX para comprar e intercambiar dentro de la plataforma."}
              </p>
            </div>
            <Button variant="gold" size="sm" className="shrink-0" onClick={() => setShowOfertaCredito(true)}>
              Activar IOX
            </Button>
          </div>
        )}

        {esMiPerfil && !editando && (
          <div className="mb-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Compras con IOX e intercambios requieren identidad verificada.
            </p>
            {usuario?.kycVerificado ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm shrink-0">
                <CheckCircle2 className="w-5 h-5" />
                Identidad verificada
              </div>
            ) : (
              <Button
                variant="gold"
                size="sm"
                className="shrink-0 w-full sm:w-auto"
                disabled={kycBtnLoading}
                onClick={async () => {
                  setKycBtnLoading(true);
                  try {
                    const { url } = await kycService.startVerificationSession();
                    window.location.href = url;
                  } catch (e: unknown) {
                    setKycBtnLoading(false);
                    const msg = e instanceof Error ? e.message : "No se pudo iniciar";
                    toast({ title: "Error", description: msg, variant: "destructive" });
                  }
                }}
              >
                Verifica tu identidad
              </Button>
            )}
          </div>
        )}

        {esMiPerfil && !editando && !(usuario?.interesesQuiero?.length) && (
          <div className="mb-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Configurá «Lo que quiero»</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Son palabras clave (zapatillas, juegos de mesa…) para priorizar coincidencias. Está en <strong className="text-foreground">Editar perfil</strong>, debajo de «Lo que busco».
                </p>
              </div>
            </div>
            <Button type="button" variant="gold" size="sm" className="shrink-0 w-full sm:w-auto" onClick={abrirEdicionLoQueQuiero}>
              Ir a «Lo que quiero»
            </Button>
          </div>
        )}

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
                  {fotoPerfil && <AvatarImage src={fotoPerfil} alt={nombreMostrar} />}
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
                      <label className="text-sm font-medium text-muted-foreground">Nombre de tu tienda o perfil público</label>
                      <Input
                        value={formData.nombreTienda ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, nombreTienda: e.target.value }))}
                        className="mt-1"
                        placeholder="Ej: Mi Tienda, Taller Hernando, Lautaro Figueroa"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Es lo que verán otros en tu perfil y publicaciones. Si lo dejás vacío, se usa tu nombre de cuenta.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">URL de tu perfil</label>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-sm text-muted-foreground shrink-0">/perfil/</span>
                        <Input
                          value={formData.profileSlug ?? ''}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              profileSlug: sanitizeProfileSlugInput(e.target.value),
                            }))
                          }
                          placeholder="mi-tienda"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solo letras, números y guiones. Ej: <code className="text-foreground">mi-tienda</code> o{' '}
                        <code className="text-foreground">lautaro-figueroa-b7324s23</code>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre de cuenta</label>
                      <Input
                        value={formData.nombre ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Nombre registrado en la plataforma (intercambios y mensajes internos).
                      </p>
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
                    <div id="config-lo-que-quiero">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold" />
                        Lo que quiero (productos de mi interés)
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        Palabras clave como zapatillas, juegos de mesa, guitarra… En coincidencias verás primero publicaciones que encajen con esto (además del precio).
                      </p>
                      <div className="flex flex-wrap gap-2 min-h-[2rem]">
                        {(formData.interesesQuiero ?? []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1 pr-1 font-normal">
                            {tag}
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-muted"
                              onClick={() => quitarInteres(tag)}
                              aria-label={`Quitar ${tag}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Input
                          value={interesInput}
                          onChange={(e) => setInteresInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              agregarInteres();
                            }
                          }}
                          placeholder="Ej: zapatillas"
                          maxLength={80}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={agregarInteres} className="shrink-0">
                          Agregar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hasta 25 palabras, mínimo 2 caracteres cada una.
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
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{nombreMostrar}</h1>
                      {usuario?.kycVerificado && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          <IdentidadVerificadaBadge iconClassName="h-5 w-5" />
                          Identidad verificada
                        </span>
                      )}
                      {usuario?.verificado && !usuario?.kycVerificado && (
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
                    {(usuario?.interesesQuiero?.length ?? 0) > 0 || esMiPerfil ? (
                      <div className="mb-4 p-4 rounded-xl bg-gold/5 border border-gold/25">
                        <p className="text-xs font-semibold text-gold uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {esMiPerfil ? 'Lo que quiero' : 'Lo que quiere'}
                        </p>
                        {esMiPerfil ? (
                          <LoQueBuscoEditor
                            terminosActivos={usuario?.interesesQuiero ?? []}
                            interesesQuiero={usuario?.interesesQuiero ?? []}
                            necesita={usuario?.necesita}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {usuario!.interesesQuiero!.map((tag) => (
                              <Badge key={tag} variant="secondary" className="font-normal bg-background/80">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {esMiPerfil
                            ? 'Así priorizamos coincidencias con lo que te interesa.'
                            : 'Si tenés algo parecido, podés proponer un intercambio desde el detalle de tu publicación.'}
                        </p>
                      </div>
                    ) : null}
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
      {esMiPerfil && user?.id && (
        <OfertaCreditoTerminos
          userId={user.id}
          open={showOfertaCredito}
          onClose={() => setShowOfertaCredito(false)}
          onAceptar={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
          onRechazar={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
        />
      )}
    </Layout>
  );
};

export default Perfil;
