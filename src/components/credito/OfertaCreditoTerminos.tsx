import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { CREDITO_OFERTA_INGRESO, COMISION_IOX_PORCENTAJE } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

const STORAGE_KEY_PREFIX = "intercambius_credito_aceptado_";
const STORAGE_PIONEROS_PREFIX = "intercambius_bienvenida_pioneros_";

type Props = {
  userId: number;
  open: boolean;
  onClose: () => void;
  onAceptar?: () => void;
  onRechazar?: () => void;
};

function Seccion({ children }: { children: ReactNode }) {
  return <div className="space-y-2 border-t border-border/80 pt-4 mt-4 first:mt-0 first:border-t-0 first:pt-0">{children}</div>;
}

function ContenidoSeisMeses() {
  return (
    <div className="space-y-3 text-sm text-muted-foreground text-left">
      <p>
        Si pasaron 6 meses y no pudiste generar ingresos dentro de la plataforma, no te preocupes: tu deuda en IOX no genera intereses ni penalizaciones.
      </p>
      <p className="font-medium text-foreground">En Intercambius tenés distintas formas de equilibrar tu cuenta:</p>
      <ul className="list-disc pl-4 space-y-2">
        <li>
          <strong className="text-foreground">Opción 1: Colaborar con una ONG.</strong> Podés elegir una organización de las que trabajan con nosotros y apoyamos para realizar una jornada de un día de trabajo equivalente a tu deuda (por ejemplo, si son 50.000 IOX). Una vez completada, tu deuda queda cancelada.
        </li>
        <li>
          <strong className="text-foreground">Opción 2: Participar en actividades de Intercambius.</strong> Podés colaborar en ferias de intercambio, eventos o actividades de la plataforma (como anfitrión o soporte). Estas participaciones también permiten cancelar tu deuda.
        </li>
        <li>
          <strong className="text-foreground">Opción 3: Aportar con tus habilidades.</strong> Podés colaborar en tareas como auditorías, diseño gráfico, carga de datos (data entry), soporte operativo u otras necesidades de la comunidad. Estas tareas también sirven para equilibrar tu saldo.
        </li>
      </ul>
      <p>
        <strong className="text-foreground">Importante:</strong> no hay intereses ni penalizaciones. Siempre existe una forma de cancelar tu deuda aportando valor real.
      </p>
      <p>
        <strong className="text-foreground">En resumen:</strong> si no podés vender, podés contribuir. Tu deuda se cancela participando.
      </p>
    </div>
  );
}

/** Modal al ingresar: bienvenida, crédito IOX, términos y segundo mensaje para pioneros. */
export const OfertaCreditoTerminos = ({
  userId,
  open,
  onClose,
  onAceptar,
  onRechazar,
}: Props) => {
  const [aceptando, setAceptando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const [seisMesesOpen, setSeisMesesOpen] = useState(false);
  const [pionerosOpen, setPionerosOpen] = useState(false);
  const { formatIX } = useCurrencyVariant();

  useEffect(() => {
    if (userId && hasRespondidoOfertaCredito(userId) && !hasVistoBienvenidaPioneros(userId)) {
      setPionerosOpen(true);
    }
  }, [userId]);

  const abrirPionerosSiCorresponde = () => {
    onClose();
    if (!hasVistoBienvenidaPioneros(userId)) {
      setPionerosOpen(true);
    }
  };

  const handleAceptar = () => {
    setAceptando(true);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "aceptado");
      onAceptar?.();
      abrirPionerosSiCorresponde();
    } finally {
      setAceptando(false);
    }
  };

  const handleRechazar = () => {
    setRechazando(true);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "rechazado");
      onRechazar?.();
      abrirPionerosSiCorresponde();
    } finally {
      setRechazando(false);
    }
  };

  const cerrarPioneros = () => {
    try {
      localStorage.setItem(`${STORAGE_PIONEROS_PREFIX}${userId}`, "true");
    } catch {
      /* ignore */
    }
    setPionerosOpen(false);
  };

  const ixMax = formatIX(CREDITO_OFERTA_INGRESO);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0 space-y-1">
            <DialogTitle className="text-xl sm:text-2xl pr-8">👋 Bienvenido a Intercambius</DialogTitle>
            <DialogDescription className="sr-only">
              Oferta de crédito en IOX y condiciones de uso. Podés aceptar o usar solo dinero tradicional.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[min(60vh,520px)] px-6">
            <div className="pr-4 pb-2 text-sm text-muted-foreground text-left space-y-0">
              <p>
                Te ofrecemos hasta <strong className="text-foreground">{ixMax} de crédito</strong> para que puedas empezar a intercambiar.
              </p>

              <Seccion>
                <p className="font-medium text-foreground">💡 ¿Qué es IOX?</p>
                <p>
                  IOX es una unidad de intercambio dentro de la plataforma, equivalente al valor de tu moneda local.
                </p>
                <p>
                  <strong className="text-foreground">👉 1 IOX ≈ 1 peso</strong> (referencial)
                </p>
              </Seccion>

              <Seccion>
                <p className="font-medium text-foreground">🚀 Si aceptás los términos y condiciones:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    El crédito en IOX es a <strong className="text-foreground">tasa 0%</strong>, sin interés y a devolver cuando puedas dentro del sistema.
                  </li>
                  <li>
                    Tu saldo podrá ser negativo, pero el crédito no es automático: se habilita <strong className="text-foreground">únicamente cuando publicás un producto o servicio</strong>.
                  </li>
                  <li>
                    El monto disponible depende de tu publicación:
                    <br />
                    👉 si publicás por 20.000 IOX, ese será tu límite de crédito
                    <br />
                    👉 el máximo total es de {ixMax}
                  </li>
                  <li>Podés usar ese crédito para comprar dentro de la plataforma.</li>
                </ul>
                <p className="pt-2">
                  <button
                    type="button"
                    className="text-gold font-medium hover:underline underline-offset-2 text-left"
                    onClick={() => setSeisMesesOpen(true)}
                  >
                    ¿Qué pasa si no logro vender nada en 6 meses?
                  </button>
                </p>
              </Seccion>

              <Seccion>
                <p className="font-medium text-foreground">🙂 Si no aceptás:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Tu saldo quedará en 0.</li>
                  <li>Podrás operar normalmente dentro de la plataforma utilizando dinero tradicional 💵</li>
                </ul>
                <p>
                  👉 No estás obligado a usar nuestra moneda complementaria IOX ni a tomar crédito. Si tu intención es solo comprar y no querés vender, sos igualmente una parte clave de la comunidad 💛
                </p>
              </Seccion>

              <Seccion>
                <p className="font-medium text-foreground">🔄 En cada intercambio (compra o venta):</p>
                <p>No hay comisiones fijas.</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    👉 Si el comprador tiene IOX disponible, una parte del pago (<strong className="text-foreground">{COMISION_IOX_PORCENTAJE}%</strong>) se realiza en IOX.
                  </li>
                  <li>👉 Si el comprador no tiene IOX, el pago se realiza 100% en dinero tradicional.</li>
                </ul>
              </Seccion>

              <p className="text-xs pt-4 pb-4">
                Los textos legales completos están en{" "}
                <Link to="/terminos" className="text-gold font-medium hover:underline" onClick={() => onClose()}>
                  términos y condiciones IOX
                </Link>
                .
              </p>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t border-border flex-col sm:flex-row gap-2 shrink-0 bg-background">
            <Button
              variant="outline"
              className="flex-1 order-2 sm:order-1"
              onClick={handleRechazar}
              disabled={aceptando || rechazando}
            >
              {rechazando ? "…" : "❌ No aceptar (usar solo dinero tradicional)"}
            </Button>
            <Button
              variant="gold"
              className="flex-1 order-1 sm:order-2 bg-gold hover:bg-gold/90"
              onClick={handleAceptar}
              disabled={aceptando || rechazando}
            >
              {aceptando ? "…" : "✅ Aceptar términos (activar crédito en IOX)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={seisMesesOpen} onOpenChange={setSeisMesesOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>¿Qué pasa si no logro vender nada en 6 meses?</DialogTitle>
            <DialogDescription className="sr-only">
              Opciones para equilibrar tu cuenta sin intereses ni penalizaciones.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-3">
            <div className="pb-2">
              <ContenidoSeisMeses />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="gold" className="w-full sm:w-auto" onClick={() => setSeisMesesOpen(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pionerosOpen}
        onOpenChange={(o) => {
          if (!o) cerrarPioneros();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-lg sm:text-xl pr-8">¡Sos de los primeros 5 mil!</DialogTitle>
            <DialogDescription className="sr-only">
              Beneficio para los primeros usuarios y pasos sugeridos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6">
            <div className="pr-2 pb-4 text-sm text-muted-foreground text-left space-y-4">
              <p>
                <strong className="text-foreground">Felicidades:</strong> estás entre los primeros 5 mil usuarios. Si seguís estos pasos, el uso de este sitio para vos va a ser gratis de por vida.
              </p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Publicá un producto o servicio que puedas vender; cualquier cosa que tengas en tu casa que no uses hace 6 meses o más es probable que ya no la necesites.</li>
                <li>Concretá una venta o compra dentro de 3 meses.</li>
                <li>Seguinos en Instagram, Facebook o alguna red social que utilices (pasanos tu usuario para poder verificar que lo hiciste).</li>
                <li>
                  Compartí una historia diciendo que estás usando este sitio; etiquetanos en la historia o posteo que subas.
                </li>
              </ol>
              <p>
                Si no tenés Instagram podés usar alguna otra red social y si no usás ninguna no pasa nada: <strong className="text-foreground">avisános</strong> así te damos este beneficio igual. Si no, no te podemos considerar para este beneficio. También podés conversar este beneficio refiriendo a dos personas que realmente usen la página: enviá un mail a{" "}
                <a href="mailto:beneficios@intercambius.com.ar" className="text-gold font-medium hover:underline break-all">
                  beneficios@intercambius.com.ar
                </a>{" "}
                y te contamos cómo hacerlo, es muy fácil.
              </p>
              <p>
                <strong className="text-foreground">¿Por qué gratis de por vida?</strong> Porque dentro de unos meses a los usuarios que entren después de vos y hayan realmente usado el sitio varias veces les vamos a cobrar una suscripción mensual, que desde ya te avisamos que va a ser súper baja. Queremos que todos puedan acceder a esta nueva forma de intercambiar, pero tenemos muchas cosas que pagar y mucho en qué invertir para crecer y llegar a más gente.
              </p>
              <p>
                Intercambius es una empresa de carácter social:{" "}
                <Link to="/economia" className="text-gold font-medium hover:underline">
                  acá te explicamos qué significa esto para nosotros
                </Link>
                .
              </p>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border shrink-0 bg-background">
            <Button variant="gold" className="w-full sm:w-auto" onClick={cerrarPioneros}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const getCreditoAceptado = (userId: number): "aceptado" | "rechazado" | null => {
  try {
    const v = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (v === "aceptado" || v === "rechazado") return v;
    return null;
  } catch {
    return null;
  }
};

export const hasRespondidoOfertaCredito = (userId: number): boolean =>
  getCreditoAceptado(userId) !== null;

export const hasVistoBienvenidaPioneros = (userId: number): boolean => {
  try {
    return localStorage.getItem(`${STORAGE_PIONEROS_PREFIX}${userId}`) === "true";
  } catch {
    return true;
  }
};
