import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, MapPin, Heart, AlertCircle, Loader2, Repeat, Package, ExternalLink, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { userService } from "@/services/user.service";
import { busquedasService } from "@/services/busquedas.service";
import { marketService, MarketItem } from "@/services/market.service";
import { chatService } from "@/services/chat.service";
import { useToast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api";
import { KycRequiredDialog } from "@/components/kyc/KycRequiredDialog";
import { GuiaCoincidencias } from "@/components/onboarding/GuiaCoincidencias";
import { CREDIT_LIMIT_DEFAULT } from "@/lib/constants";
import { prefetchChatDetalleYNavigate } from "@/lib/chat-navigation";
import {
  MATCH_THRESHOLD_PRIMARY,
  MATCH_THRESHOLD_RELATED,
  itemMaxTablaScore,
  itemTablaHitCount,
  scoreInterestPhraseAgainstItem,
} from "@/lib/fuzzy-interest-match";

const ITEMS_POR_PAGINA = 6;
/** Objetivo de ítems en «Los que me interesan»; si hay menos, se suman parecidos por umbral menor. */
const MIN_PRODUCTOS_INTERES = 10;
/** Pool del market para evaluar coincidencia ~70 % en cliente (typos / plurales / palabras sueltas). */
const MARKET_POOL_LIMIT = 280;

const RUBROS = {
  servicios: { label: "Servicios", icon: "🔧" },
  productos: { label: "Productos", icon: "📦" },
  alimentos: { label: "Alimentos", icon: "🍎" },
  experiencias: { label: "Experiencias", icon: "🎭" }
};

const Coincidencias = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatIX } = useCurrencyVariant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { puedeRegistrarBusquedas } = useCookieConsent();
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [miProductoId, setMiProductoId] = useState<number | null>(null);
  const [productoInteresadoId, setProductoInteresadoId] = useState<number | null>(null);
  const [paginaInteres, setPaginaInteres] = useState(1);
  const [kycRequiredOpen, setKycRequiredOpen] = useState(false);

  const { data: userData, isPending: loadingPerfilUsuario } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData ?? user ?? null;

  const terminosInteres = useMemo(() => {
    const raw = currentUser?.interesesQuiero ?? [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of raw) {
      const s = String(t).trim();
      if (s.length === 0) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }, [currentUser?.interesesQuiero]);

  const { data: misProductosResponse } = useQuery({
    queryKey: ['marketItems', 'mis-productos', currentUser?.id],
    queryFn: () => marketService.getItems({ vendedorId: currentUser!.id!, page: 1, limit: 100 }),
    enabled: !!currentUser?.id,
  });

  const misProductos = misProductosResponse?.data ?? [];

  const {
    data: marketPoolTabla,
    isPending: loadingPoolTabla,
    error: errorPoolTabla,
  } = useQuery({
    queryKey: ['marketItems', 'coincidencias-pool-fuzzy', currentUser?.id],
    queryFn: () =>
      marketService.getItems({
        page: 1,
        limit: MARKET_POOL_LIMIT,
        soloDisponibles: true,
      }),
    enabled: !!currentUser?.id && terminosInteres.length > 0,
  });

  /** Sin palabras en la Tabla: mostrar market general para poder elegir con qué intercambiar. */
  const {
    data: marketSinIntereses,
    isLoading: loadingSinIntereses,
    error: errorSinIntereses,
  } = useQuery({
    queryKey: ['marketItems', 'coincidencias-sin-tabla', currentUser?.id],
    queryFn: () => marketService.getItems({ page: 1, limit: 80, soloDisponibles: true }),
    enabled: !!currentUser?.id && terminosInteres.length === 0,
  });

  const { listaCoincidencias, idsSimilares, countPrimariosMatch } = useMemo(() => {
    if (terminosInteres.length === 0) {
      const rows = marketSinIntereses?.data ?? [];
      const list = rows.filter(
        (item) =>
          item?.id &&
          item.vendedorId !== currentUser?.id &&
          item.disponible !== false
      );
      return {
        listaCoincidencias: list,
        idsSimilares: new Set<number>(),
        countPrimariosMatch: list.length,
      };
    }

    const rows = marketPoolTabla?.data ?? [];
    const candidatos = rows.filter(
      (item) =>
        item?.id &&
        item.vendedorId !== currentUser?.id &&
        item.disponible !== false
    );

    const scored = candidatos.map((item) => {
      const titulo = item.titulo ?? "";
      const desc = item.descripcion ?? "";
      const maxScore = itemMaxTablaScore(terminosInteres, titulo, desc);
      const hitsPrimary = itemTablaHitCount(
        terminosInteres,
        titulo,
        desc,
        MATCH_THRESHOLD_PRIMARY
      );
      let firstTermIdx = 999;
      for (let i = 0; i < terminosInteres.length; i++) {
        if (
          scoreInterestPhraseAgainstItem(terminosInteres[i], titulo, desc) >=
          MATCH_THRESHOLD_PRIMARY
        ) {
          firstTermIdx = i;
          break;
        }
      }
      return { item, maxScore, hitsPrimary, firstTermIdx };
    });

    const primarios = scored
      .filter((x) => x.maxScore >= MATCH_THRESHOLD_PRIMARY)
      .sort((a, b) => {
        if (b.hitsPrimary !== a.hitsPrimary) return b.hitsPrimary - a.hitsPrimary;
        if (b.maxScore !== a.maxScore) return b.maxScore - a.maxScore;
        if (a.firstTermIdx !== b.firstTermIdx) return a.firstTermIdx - b.firstTermIdx;
        return 0;
      })
      .map((x) => x.item);

    const primaryIds = new Set(primarios.map((i) => i.id));
    const similaresIds = new Set<number>();

    let list = [...primarios];
    if (list.length < MIN_PRODUCTOS_INTERES) {
      const faltan = MIN_PRODUCTOS_INTERES - list.length;
      const relacionados = scored
        .filter(
          (x) =>
            !primaryIds.has(x.item.id) &&
            x.maxScore >= MATCH_THRESHOLD_RELATED &&
            x.maxScore < MATCH_THRESHOLD_PRIMARY
        )
        .sort((a, b) => b.maxScore - a.maxScore);

      for (const x of relacionados) {
        if (similaresIds.size >= faltan) break;
        similaresIds.add(x.item.id);
        list.push(x.item);
      }
    }

    return {
      listaCoincidencias: list,
      idsSimilares: similaresIds,
      countPrimariosMatch: primarios.length,
    };
  }, [
    terminosInteres,
    terminosInteres.length,
    marketSinIntereses?.data,
    marketPoolTabla?.data,
    currentUser?.id,
  ]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const iniciarIntercambioMutation = useMutation({
    mutationFn: ({
      itemDestino,
      miProducto,
    }: {
      itemDestino: MarketItem;
      miProducto: MarketItem;
    }) => {
      return chatService.iniciarIntercambio({
        marketItemId: itemDestino.id,
        miNombre: currentUser?.nombre || 'Intercambius',
        miProducto: {
          titulo: miProducto.titulo,
          descripcion: miProducto.descripcion,
          imagen: miProducto.images?.[0]?.url || miProducto.imagen,
          url: miProducto.id ? `${baseUrl}/producto/${miProducto.id}` : undefined,
          precio: miProducto.precio,
          rubro: miProducto.rubro,
        },
        tuProducto: {
          titulo: itemDestino.titulo,
          descripcion: itemDestino.descripcion,
          imagen: itemDestino.images?.[0]?.url || itemDestino.imagen,
          url: itemDestino.id ? `${baseUrl}/producto/${itemDestino.id}` : undefined,
          precio: itemDestino.precio,
          rubro: itemDestino.rubro,
        },
      });
    },
    onSuccess: async (data) => {
      toast({ title: "¡Mensaje enviado!", description: "Ya podés negociar el intercambio por chat." });
      await prefetchChatDetalleYNavigate(queryClient, navigate, data.conversacionId);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.data?.code === "KYC_REQUIRED") {
        setKycRequiredOpen(true);
        return;
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar el intercambio",
        variant: "destructive",
      });
    },
  });

  const toggleFavorito = (id: number) => {
    setFavoritos(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const recordRef = useRef<NodeJS.Timeout | null>(null);
  const interesesRegistroKey = terminosInteres.join("|");
  useEffect(() => {
    if (!puedeRegistrarBusquedas || !currentUser?.id || terminosInteres.length === 0) return;
    recordRef.current && clearTimeout(recordRef.current);
    recordRef.current = setTimeout(() => {
      busquedasService.registrar({ termino: interesesRegistroKey, seccion: 'coincidencias' });
    }, 800);
    return () => { recordRef.current && clearTimeout(recordRef.current); };
  }, [interesesRegistroKey, puedeRegistrarBusquedas, currentUser?.id, terminosInteres.length]);

  useEffect(() => {
    setPaginaInteres(1);
  }, [interesesRegistroKey]);

  const miProductoSeleccionado = misProductos.find(p => p.id === miProductoId);
  const sinTablaIntereses = terminosInteres.length === 0;
  const isLoading = sinTablaIntereses ? loadingSinIntereses : loadingPoolTabla;
  const errorListado = sinTablaIntereses ? errorSinIntereses : errorPoolTabla;

  const totalPaginas = Math.ceil(listaCoincidencias.length / ITEMS_POR_PAGINA) || 1;
  const paginaInteresClamped = Math.min(Math.max(1, paginaInteres), totalPaginas);
  const inicio = (paginaInteresClamped - 1) * ITEMS_POR_PAGINA;
  const coincidenciasPagina = listaCoincidencias.slice(inicio, inicio + ITEMS_POR_PAGINA);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </Layout>
    );
  }

  if (loadingPerfilUsuario || !currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold mb-4" />
          <p className="text-muted-foreground">Cargando tu perfil...</p>
        </div>
      </Layout>
    );
  }

  const saldo = Number(currentUser?.saldo ?? 0) || 0;
  const limite = Number(currentUser?.limite ?? 0) || CREDIT_LIMIT_DEFAULT;
  const enLimiteDeuda = limite > 0 && saldo <= -limite; // Ya debe 100k: solo pagar por fuera
  const puedeComprar = saldo > -limite;

  return (
    <Layout>
      <KycRequiredDialog open={kycRequiredOpen} onOpenChange={setKycRequiredOpen} contexto="intercambio" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Intercambius
            </h1>
          </div>
          <p className="text-muted-foreground">
            Elegí lo que ofrecés, buscá lo que querés y negociá en Intercambius
          </p>
        </div>

        <GuiaCoincidencias />

        <Card className="border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <label className="text-sm font-medium mb-2 block">Tu Tabla (lo que te interesa)</label>
                <p className="text-xs text-muted-foreground mb-3">
                  {sinTablaIntereses
                    ? "Las palabras clave se cargan desde el menú Tabla (tu perfil). Mientras tanto podés elegir cualquier publicación del Market abajo para proponer un intercambio."
                    : "Personalizamos la columna de la derecha con estas palabras. Para editarlas usá Tabla en el menú o el botón de acá."}
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  {sinTablaIntereses ? (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      Sin palabras cargadas
                    </Badge>
                  ) : (
                    terminosInteres.map((t) => (
                      <Badge key={t} variant="secondary" className="font-normal">
                        {t}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <Button variant={sinTablaIntereses ? "gold" : "outline"} size="sm" className="shrink-0 gap-2" asChild>
                <Link to={`/perfil/${currentUser.id}?intereses=1`}>
                  <Pencil className="w-4 h-4" />
                  {sinTablaIntereses ? "Ir a la Tabla" : "Editar Tabla"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Columna izquierda: Mis productos o servicios */}
          <div className="xl:w-1/2 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gold" />
              Mis productos o servicios
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Elegí cuál ofrecés a cambio para proponer un intercambio
            </p>
            {misProductos.length === 0 ? (
              <div className="flex-1 bg-card rounded-xl border border-border p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Aún no tenés productos publicados</p>
                <Button variant="gold" onClick={() => navigate("/mis-publicaciones")}>
                  Ir a Mis publicaciones
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {misProductos.map((p) => (
                  <Card
                    key={p.id}
                    className={`coincidencia-card cursor-pointer border-border ${
                      miProductoId === p.id ? "coincidencia-card--selected" : ""
                    }`}
                    onClick={() => setMiProductoId(miProductoId === p.id ? null : p.id)}
                  >
                    <div className="relative group">
                      <img
                        src={p.images?.[0]?.url || p.imagen || "https://via.placeholder.com/300x200"}
                        alt={p.titulo}
                        className="w-full h-40 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <Badge className="absolute top-2 left-2 bg-background/95 backdrop-blur-sm text-foreground border border-border/50">
                        {RUBROS[p.rubro as keyof typeof RUBROS]?.icon}{" "}
                        {RUBROS[p.rubro as keyof typeof RUBROS]?.label}
                      </Badge>
                      {miProductoId === p.id && (
                        <div className="absolute top-2 right-2 bg-gold text-primary-foreground rounded-full p-1.5">
                          <Repeat className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base line-clamp-2 mb-1">{p.titulo}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.descripcion}</p>
                      <button
                        type="button"
                        className="text-xs text-gold hover:underline flex items-center gap-1 mb-2"
                        onClick={(e) => { e.stopPropagation(); navigate(`/producto/${p.id}`); }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver detalle
                      </button>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold gold-text">{formatIX(p.precio)}</span>
                        <span className={`text-sm font-medium ${miProductoId === p.id ? "text-gold" : "text-muted-foreground"}`}>
                          {miProductoId === p.id ? "✓ Elegido" : "Elegir"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: Los que me interesan */}
          <div id="coincidencias-resultados" className="xl:w-1/2 flex flex-col min-w-0">
        {/* Alerta de crédito */}
        {!puedeComprar && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {enLimiteDeuda
                ? `Llegaste al límite de crédito (-${formatIX(limite)}). Solo podés pagar por fuera de la página hasta que reduzcas tu deuda.`
                : `Has alcanzado el límite de crédito negativo (${formatIX(limite)}). Necesitás generar créditos positivos para continuar intercambiando.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Info de crédito disponible */}
        <div className="bg-card rounded-lg p-4 border border-border mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crédito disponible</p>
              <p className="text-lg font-semibold">
                {formatIX(saldo)}
                <span className="text-sm text-muted-foreground ml-2">
                  (Límite: {formatIX(-limite)})
                </span>
              </p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Tu oferta</p>
              <p className="text-lg font-semibold gold-text truncate">
                {miProductoSeleccionado ? miProductoSeleccionado.titulo : "Seleccioná un producto"}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          Los que me interesan
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {sinTablaIntereses ? (
            <>
              Elegí una publicación del Market y proponé el intercambio con tu producto de la izquierda. Cuando cargues tu{" "}
              <Link to={`/perfil/${currentUser.id}?intereses=1`} className="text-gold font-medium underline underline-offset-2">
                Tabla
              </Link>
              , aquí priorizaremos lo que te interesa y sugerencias parecidas.
            </>
          ) : (
            <>
              Coincidencia aproximada ~70 % entre tu Tabla y el título o la descripción (incluye typos y palabras sueltas). Primero lo más alineado
              {countPrimariosMatch < MIN_PRODUCTOS_INTERES && idsSimilares.size > 0
                ? "; las marcadas «Parecido» usan un umbral algo más amplio hasta diez sugerencias."
                : "."}{" "}
              Seleccioná una y tocá &quot;Quiero intercambiar&quot;.
            </>
          )}
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span className="ml-2 text-muted-foreground">Cargando publicaciones...</span>
          </div>
        ) : errorListado ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error al cargar publicaciones</p>
            <p className="text-sm text-muted-foreground">
              {errorListado instanceof Error ? errorListado.message : "Intentá de nuevo más tarde"}
            </p>
          </div>
        ) : listaCoincidencias.length > 0 ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coincidenciasPagina
              .filter((item: MarketItem) => item && item.id)
              .map((item: MarketItem) => {
                const isSelected = productoInteresadoId === item.id;
                return (
                  <Card
                    key={item.id}
                    className={`coincidencia-card cursor-pointer border-border ${
                      isSelected ? "coincidencia-card--selected" : ""
                    }`}
                    onClick={() => setProductoInteresadoId(isSelected ? null : item.id)}
                  >
                    <div className="relative group">
                      <img
                        src={item.images?.[0]?.url || item.imagen || 'https://via.placeholder.com/300x200'}
                        alt={item.titulo || 'Producto'}
                        className="w-full h-40 object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200';
                        }}
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
                      {idsSimilares.has(item.id) && (
                        <Badge className="absolute bottom-2 right-2 bg-muted text-foreground border border-border text-[10px] px-1.5 py-0">
                          Parecido
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="absolute bottom-2 left-2 bg-gold text-primary-foreground rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          Quiero este
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="font-semibold text-base line-clamp-2 flex-1 hover:text-gold transition-colors">
                          {item.titulo}
                        </h3>
                        <span className="text-lg font-bold gold-text flex-shrink-0">
                          {formatIX(item.precio)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.descripcion}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 gap-2">
                        <button
                          type="button"
                          className="text-gold hover:underline flex items-center gap-1 min-w-0"
                          onClick={(e) => { e.stopPropagation(); navigate(`/producto/${item.id}`); }}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">Ver detalle</span>
                        </button>
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{item.ubicacion}</span>
                        </div>
                        {item.distancia && (
                          <span className="flex-shrink-0">{item.distancia} km</span>
                        )}
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-semibold py-2"
                        disabled={!miProductoSeleccionado || iniciarIntercambioMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!miProductoSeleccionado) {
                            toast({ title: "Seleccioná tu producto", description: "Elegí qué ofrecés a cambio en el panel de la izquierda.", variant: "destructive" });
                            return;
                          }
                          if (!currentUser?.kycVerificado) {
                            setKycRequiredOpen(true);
                            return;
                          }
                          iniciarIntercambioMutation.mutate({
                            itemDestino: item,
                            miProducto: miProductoSeleccionado,
                          });
                        }}
                      >
                        {iniciarIntercambioMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Repeat className="w-4 h-4 mr-2" />
                        )}
                        Quiero intercambiar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={paginaInteresClamped <= 1}
                onClick={() => setPaginaInteres(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {paginaInteresClamped} de {totalPaginas}
                <span className="ml-1">
                  ({listaCoincidencias.length} productos)
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={paginaInteresClamped >= totalPaginas}
                onClick={() => setPaginaInteres(p => Math.min(totalPaginas, p + 1))}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          </>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2 font-medium">
              {sinTablaIntereses
                ? "No hay publicaciones de otros usuarios para mostrar"
                : "No hay publicaciones que coincidan con tu Tabla"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {sinTablaIntereses
                ? misProductos.length === 0
                  ? "Creá un producto en Mis publicaciones para proponer intercambios cuando haya ofertas en el Market."
                  : "Entrá al Market o esperá a que haya más publicaciones disponibles."
                : misProductos.length === 0
                  ? "Podés sumar palabras en tu Tabla o crear un producto en Mis publicaciones para proponer intercambios."
                  : "Ampliá las palabras en tu Tabla o explorá el Market para ver más publicaciones."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {!sinTablaIntereses && (
                <Button variant="outline" asChild>
                  <Link to={`/perfil/${currentUser.id}?intereses=1`}>Ajustar Tabla</Link>
                </Button>
              )}
              {sinTablaIntereses && (
                <Button variant="gold" asChild>
                  <Link to={`/perfil/${currentUser.id}?intereses=1`}>Cargar mi Tabla</Link>
                </Button>
              )}
              <Button variant={sinTablaIntereses ? "outline" : "gold"} asChild>
                <Link to="/market">Ir al Market</Link>
              </Button>
              {misProductos.length === 0 && (
                <Button variant="secondary" onClick={() => navigate("/crear-producto")}>
                  Crear mi primer producto
                </Button>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Coincidencias;
