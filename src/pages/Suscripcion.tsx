import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { intercambiosService } from "@/services/intercambios.service";
import { suscripcionService } from "@/services/suscripcion.service";
import { useToast } from "@/hooks/use-toast";
import {
  KYC_USD,
  PLANES,
  codigoPlan,
  evaluarFreemium,
  grupoSuscripcion,
  kycCubierto,
  suscripcionCubre,
  type CicloSuscripcion,
} from "@/lib/suscripcion";

function fechaLarga(date: Date | null): string {
  if (!date) return "sin fecha de alta";
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

const Suscripcion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ciclo, setCiclo] = useState<CicloSuscripcion>("mensual");
  const [pagando, setPagando] = useState<"plan" | "kyc" | null>(null);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });
  const currentUser = userData || user;

  const { data: intercambios = [], isLoading: movLoading } = useQuery({
    queryKey: ["intercambios", currentUser?.id],
    queryFn: () => intercambiosService.getByUserId(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const {
    data: mp,
    isLoading: mpLoading,
    isError: mpError,
    error: mpErr,
  } = useQuery({
    queryKey: ["suscripcion", currentUser?.id],
    queryFn: () => suscripcionService.estado(),
    enabled: !!currentUser?.id,
    retry: false,
  });

  useEffect(() => {
    if (searchParams.get("retorno") !== "1") return;
    void queryClient.invalidateQueries({ queryKey: ["suscripcion", currentUser?.id] });
    toast({
      title: "Volviste de Mercado Pago",
      description: "Si el pago quedó aprobado, el estado se actualiza en unos segundos.",
    });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, queryClient, toast, currentUser?.id]);

  if (!currentUser || userLoading || movLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  const grupo = grupoSuscripcion(intercambios, currentUser.id);
  const plan = PLANES[codigoPlan(grupo, ciclo)];
  const freemium = evaluarFreemium({
    miembroDesde: currentUser.miembroDesde,
    movimientos: intercambios,
    accesoVitalicio: currentUser.accesoVitalicio === true,
  });
  const planes = mp?.planesAutorizados ?? [];
  const cubre = suscripcionCubre(grupo, planes);
  const kycOk = kycCubierto(planes, mp?.kycPago === true);
  const mostrarKyc = !plan.incluyeKyc && !kycOk;

  const irAMercadoPago = async (destino: "plan" | "kyc") => {
    setPagando(destino);
    try {
      const { initPoint } = destino === "kyc" ? await suscripcionService.pagarKyc() : await suscripcionService.checkout(plan.codigo);
      window.location.href = initPoint;
    } catch (error) {
      setPagando(null);
      toast({
        title: "No se pudo abrir Mercado Pago",
        description: error instanceof Error ? error.message : "Intentá de nuevo en unos segundos.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Suscripción</h1>
        <p className="text-muted-foreground mb-6">
          La prueba es de 3 meses o 3 transacciones, lo que ocurra primero. Después, Mercado Pago cobra el plan que te corresponde.
        </p>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6">
          <p className="text-sm font-medium text-foreground mb-2">Tu prueba</p>
          {freemium.motivo === "vitalicio" ? (
            <p className="text-sm text-muted-foreground">Tenés acceso gratis de por vida.</p>
          ) : freemium.activo ? (
            <p className="text-sm text-muted-foreground">
              Sigue vigente. Llevás <strong className="text-foreground">{freemium.usadas} de {freemium.limite}</strong> transacciones
              {freemium.vence ? <> y la prueba corta el <strong className="text-foreground">{fechaLarga(freemium.vence)}</strong></> : null}
              , lo que ocurra primero.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {freemium.motivo === "transacciones"
                ? `Se cortó porque llegaste a ${freemium.limite} transacciones.`
                : `Se cortó el ${fechaLarga(freemium.vence)} (pasaron 3 meses).`}
              {cubre ? " Tu suscripción está activa." : " Para seguir, activá la suscripción."}
            </p>
          )}
          {cubre && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-3">Suscripción activa en Mercado Pago.</p>
          )}
          {grupo === "vendedor" && planes.some((codigo) => codigo.startsWith("intercambio_")) && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-3">
              Sigue activa la suscripción de trueque. Cancelala desde Mercado Pago para que no se cobren las dos.
            </p>
          )}
          {mp && !mp.configurado && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-3">
              El cobro todavía no está habilitado en el servidor: falta el Access Token de Mercado Pago.
            </p>
          )}
          {mpError && (
            <p className="text-sm text-destructive mt-3">
              {mpErr instanceof Error ? mpErr.message : "No pudimos consultar el estado del pago."}
            </p>
          )}
          {mpLoading && <p className="text-sm text-muted-foreground mt-3">Consultando Mercado Pago…</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {grupo === "vendedor"
              ? "Ya tuviste una operación que es solo de venta. Tu plan es el de USD 5 por mes, o USD 45 al año (incluye el KYC)."
              : "Mientras solo hagas trueque, canje, permuta o compras, tu plan es el de USD 3 por mes, más USD 3 de KYC. Al año son USD 30 e incluyen el KYC. Si registrás una venta, pasa al plan de USD 5 / USD 45."}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <Button
              type="button"
              variant={ciclo === "mensual" ? "gold" : "outline"}
              onClick={() => setCiclo("mensual")}
            >
              Mensual
            </Button>
            <Button
              type="button"
              variant={ciclo === "anual" ? "gold" : "outline"}
              onClick={() => setCiclo("anual")}
            >
              Anual
            </Button>
          </div>

          <p className="text-lg font-semibold">{plan.titulo}</p>
          <p className="text-4xl font-bold gold-text mt-2">
            USD {plan.montoUsd}
            <span className="text-base font-medium text-muted-foreground"> / {plan.ciclo === "mensual" ? "mes" : "año"}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">{plan.resumen}</p>
          {mostrarKyc && (
            <p className="text-sm text-foreground mt-3">
              Además, un pago único de <strong>USD {KYC_USD}</strong> por el KYC.
            </p>
          )}
          {plan.incluyeKyc && <p className="text-sm text-foreground mt-3">Este precio ya incluye el KYC.</p>}

          <div className="mt-6 flex flex-col gap-3">
            {mostrarKyc && (
              <Button
                variant="outline"
                disabled={pagando != null}
                onClick={() => void irAMercadoPago("kyc")}
              >
                {pagando === "kyc" ? "Abriendo Mercado Pago…" : `Pagar KYC (USD ${KYC_USD})`}
              </Button>
            )}
            <Button variant="gold" disabled={pagando != null} onClick={() => void irAMercadoPago("plan")}>
              {pagando === "plan" ? "Abriendo Mercado Pago…" : cubre ? "Actualizar suscripción" : "Suscribirme con Mercado Pago"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            El cobro recurrente lo hace Mercado Pago. Podés cancelarlo desde tu cuenta de Mercado Pago. Los textos del sitio están en{" "}
            <Link to="/terminos-generales" className="text-gold hover:underline">
              términos generales
            </Link>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Suscripcion;
