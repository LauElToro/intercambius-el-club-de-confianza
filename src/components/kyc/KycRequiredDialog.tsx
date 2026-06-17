import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { kycService } from "@/services/kyc.service";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texto según contexto (compra vs intercambio vs publicación) */
  contexto?: "compra" | "intercambio" | "publicacion";
};

export function KycRequiredDialog({ open, onOpenChange, contexto = "compra" }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const accion =
    contexto === "intercambio"
      ? "Para proponer un intercambio tenés que verificar tu identidad con un proceso seguro (Didit)."
      : contexto === "publicacion"
        ? "Para publicar productos o servicios en el market tenés que verificar tu identidad con un proceso seguro (Didit)."
        : "Para comprar con IOX en Intercambius tenés que verificar tu identidad con un proceso seguro (Didit).";

  const irAVerificar = async () => {
    setLoading(true);
    try {
      const { url } = await kycService.startVerificationSession();
      window.location.href = url;
    } catch (e: unknown) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "No se pudo abrir la verificación";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verificá tu identidad</AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-2">
            <span>{accion}</span>
            <span className="block text-xs text-muted-foreground">
              Vas a salir de esta pantalla hacia el proveedor de verificación. Cuando termines, volverás al panel y
              actualizaremos tu estado.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Ahora no</AlertDialogCancel>
          <Button type="button" variant="gold" disabled={loading} onClick={() => void irAVerificar()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                Abriendo…
              </>
            ) : (
              "Ir a verificar"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
