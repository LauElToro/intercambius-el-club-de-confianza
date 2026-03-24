import { useState, useEffect } from "react";
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

type Props = {
  userId: number;
  open: boolean;
  onClose: () => void;
  onAceptar?: () => void;
  onRechazar?: () => void;
};

/** Modal que se muestra al usuario al ingresar: oferta de 100k IOX de crédito y aceptación de términos. */
export const OfertaCreditoTerminos = ({
  userId,
  open,
  onClose,
  onAceptar,
  onRechazar,
}: Props) => {
  const [aceptando, setAceptando] = useState(false);
  const [rechazando, setRechazando] = useState(false);
  const { formatIX } = useCurrencyVariant();

  const handleAceptar = () => {
    setAceptando(true);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "aceptado");
      onAceptar?.();
      onClose();
    } finally {
      setAceptando(false);
    }
  };

  const handleRechazar = () => {
    setRechazando(true);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, "rechazado");
      onRechazar?.();
      onClose();
    } finally {
      setRechazando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Bienvenido a Intercambius</DialogTitle>
          <DialogDescription asChild>
            <ScrollArea className="max-h-[50vh] pr-4 text-left">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Te ofrecemos <strong className="text-foreground">{formatIX(CREDITO_OFERTA_INGRESO)} de crédito</strong> para que puedas empezar a intercambiar.
                </p>
                <p>
                  <strong className="text-foreground">Si aceptás los términos y condiciones:</strong>
                  <br />
                  Tu saldo inicial será de <strong className="text-destructive">-{formatIX(CREDITO_OFERTA_INGRESO)}</strong> (es decir, tenés 100.000 IOX de crédito para usar). Podés comprar hasta agotar ese crédito; cuando llegues a deber 100.000 IOX solo podrás pagar por fuera de la página.
                </p>
                <p>
                  <strong className="text-foreground">Si no aceptás:</strong>
                  <br />
                  Tu saldo quedará en 0. Aun así, cuando compres deberás pagar siempre al menos un <strong className="text-foreground">{COMISION_IOX_PORCENTAJE}% en IOX</strong> en cada operación, para que la moneda se vaya emitiendo.
                </p>
                <p>
                  En cada intercambio (compra o venta) se aplica un mínimo del <strong className="text-foreground">{COMISION_IOX_PORCENTAJE}% en IOX</strong>. Quienes venden por la página aceptan siempre este {COMISION_IOX_PORCENTAJE}% en IOX.
                </p>
              </div>
            </ScrollArea>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRechazar}
            disabled={aceptando || rechazando}
          >
            {rechazando ? "..." : "No aceptar (saldo 0)"}
          </Button>
          <Button
            variant="gold"
            className="flex-1 bg-gold hover:bg-gold/90"
            onClick={handleAceptar}
            disabled={aceptando || rechazando}
          >
            {aceptando ? "..." : `Aceptar términos (crédito ${formatIX(CREDITO_OFERTA_INGRESO)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
