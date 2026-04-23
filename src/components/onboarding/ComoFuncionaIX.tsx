import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  COMISION_IOX_PORCENTAJE,
  CREDITO_OFERTA_INGRESO,
  MESES_REGULARIZACION_DEUDA,
} from "@/lib/constants";

const ixOferta = CREDITO_OFERTA_INGRESO.toLocaleString("es-AR");

export const ComoFuncionaIX = () => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Info className="w-4 h-4" />
          <span>¿Qué son los IOX?</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">IOX</strong> (créditos de intercambio): cuando dás algo, recibís IOX; cuando recibís algo, gastás IOX. Al ingresar al portal se te ofrece hasta {ixOferta} IOX de crédito: si aceptás los términos, podés activar esa línea al publicar; si no aceptás, quedás en 0 y podés operar con dinero tradicional. No estás obligado a usar IOX.
          </p>
          <p>
            En cada intercambio, si el comprador tiene IOX disponible, una parte del pago (<strong className="text-foreground">{COMISION_IOX_PORCENTAJE}%</strong>) puede realizarse en IOX; si el comprador no tiene IOX, el pago puede ser 100% en dinero tradicional. Si activás crédito, podés endeudarte hasta -{ixOferta} IOX según tu publicación y el tope; al llegar al límite solo podés pagar por fuera de la página hasta reducir tu deuda.
          </p>
          <p>
            Si tras {MESES_REGULARIZACION_DEUDA} meses mantenés deuda elevada (ej. -{ixOferta} IOX), puede activarse regularización: publicar y vender, colaborar con una ONG, eventos del proyecto u otras formas acordadas.
          </p>
          <p>
            <Link to="/economia" className="font-medium text-gold hover:underline">
              Ver diseño económico y antifraude
            </Link>
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
