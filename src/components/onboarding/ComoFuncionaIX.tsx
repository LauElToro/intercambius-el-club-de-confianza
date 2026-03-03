import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

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
          <span>¿Qué son los IX?</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">IX</strong> son créditos de intercambio.
            Cuando dás algo (servicio o producto), recibís IX. Cuando recibís algo,
            gastás IX. Es una forma de medir valor sin usar dinero.
          </p>
          <p>
            Arrancás con saldo 0. Si ofrecés algo primero, sumás IX. Si recibís algo
            primero, podés entrar en negativo hasta tu límite de crédito.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
