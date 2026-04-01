import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { referidosService } from "@/services/referidos.service";
import { construirUrlReferido, normalizarSlugReferido, slugReferidoEsValido } from "@/lib/referidos";
import { Copy, Gift, Loader2, Save } from "lucide-react";
import { ApiError } from "@/lib/api";

interface ReferidosPanelProps {
  /** En dashboard: menos filas en la tabla y enlace a la página completa */
  compact?: boolean;
}

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ReferidosPanel({ compact = false }: ReferidosPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [slugInput, setSlugInput] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["referidos", "me"],
    queryFn: () => referidosService.getMe(),
  });

  const slugMutation = useMutation({
    mutationFn: (slug: string) => referidosService.updateSlug(slug),
    onSuccess: (res) => {
      queryClient.setQueryData(["referidos", "me"], res);
      setSlugInput(res.slugPersonalizado ?? "");
      toast({ title: "Enlace actualizado" });
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar. El enlace puede estar en uso.";
      toast({ title: "No se pudo guardar", description: msg, variant: "destructive" });
    },
  });

  const linkVisible = data
    ? construirUrlReferido(data.slugPersonalizado || data.codigo)
    : "";

  const copiar = async (texto: string, etiqueta: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast({ title: "Copiado", description: etiqueta });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!data) return;
    setSlugInput(data.slugPersonalizado ?? "");
  }, [data?.slugPersonalizado]);

  if (isLoading) {
    return (
      <Card className="border-gold/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-gold" />
            Referidos
          </CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "No se pudo cargar el programa de referidos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const listaReferidos = data.referidos ?? [];
  const tablaRows = compact ? listaReferidos.slice(0, 5) : listaReferidos;

  return (
    <Card className="border-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gift className="h-6 w-6 text-gold" />
          Invitá a la comunidad
        </CardTitle>
        <CardDescription>
          Compartí tu enlace o código. Cada referido queda asociado a tu cuenta. El enlace personalizado es único.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tu código</Label>
            <div className="flex gap-2">
              <Input readOnly value={data.codigo} className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copiar(data.codigo, "Código copiado")}
                aria-label="Copiar código"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link de registro</Label>
            <div className="flex gap-2">
              <Input readOnly value={linkVisible} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copiar(linkVisible, "Link copiado")}
                aria-label="Copiar link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
          <Label htmlFor="slug-referido">Enlace personalizado (opcional)</Label>
          <p className="text-xs text-muted-foreground">
            Solo letras minúsculas, números y guiones. No puede repetirse con otro usuario.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="truncate">{typeof window !== "undefined" ? window.location.origin : ""}/registro?ref=</span>
              </div>
              <Input
                id="slug-referido"
                placeholder="mi-codigo"
                value={slugInput}
                onChange={(e) => setSlugInput(normalizarSlugReferido(e.target.value))}
                className="font-mono"
                maxLength={32}
              />
            </div>
            <Button
              type="button"
              variant="gold"
              disabled={slugMutation.isPending}
              onClick={() => {
                const s = normalizarSlugReferido(slugInput);
                if (!slugReferidoEsValido(s)) {
                  toast({
                    title: "Enlace inválido",
                    description: "Usá entre 3 y 32 caracteres: letras minúsculas, números y guiones.",
                    variant: "destructive",
                  });
                  return;
                }
                slugMutation.mutate(s);
              }}
            >
              {slugMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
          {data.slugPersonalizado && (
            <p className="text-xs text-muted-foreground">
              Actual: <span className="font-mono text-foreground">{data.slugPersonalizado}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <p className="text-sm">
            <span className="font-semibold text-gold">{data.totalReferidos ?? listaReferidos.length}</span>{" "}
            {(data.totalReferidos ?? listaReferidos.length) === 1 ? "persona invitada" : "personas invitadas"}
          </p>
          {compact && (
            <Button variant="link" className="text-gold p-0 h-auto" asChild>
              <Link to="/referidos">Ver todos los referidos</Link>
            </Button>
          )}
        </div>

        {listaReferidos.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablaRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nombre}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm">{formatFecha(r.fechaRegistro)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {compact && listaReferidos.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                +{listaReferidos.length - 5} más en{" "}
                <Link to="/referidos" className="text-gold underline">
                  Referidos
                </Link>
              </p>
            )}
          </div>
        )}

        {listaReferidos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todavía nadie se registró con tu enlace. Compartilo por WhatsApp o redes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
