import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { IX_PESOS_PER_USD } from "@/lib/currency";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface HeaderSaldoProps {
  saldo: number;
  showActivarIOX?: boolean;
  onActivarIOX?: () => void;
}

/** Muestra saldo en IOX y equivalentes en ARS y USD en el header */
export const HeaderSaldo = ({ saldo, showActivarIOX, onActivarIOX }: HeaderSaldoProps) => {
  const { formatIX } = useCurrencyVariant();
  const saldoNum = Number(saldo) || 0;
  const usd = saldoNum / IX_PESOS_PER_USD;

  const line = (
    <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium lg:gap-2 lg:text-sm">
      <span className="shrink-0 whitespace-nowrap text-gold">{formatIX(saldoNum)}</span>
      <span className="hidden text-muted-foreground sm:inline" aria-hidden>
        ·
      </span>
      <span className="hidden min-w-0 truncate text-muted-foreground sm:inline">
        ${saldoNum.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
        <span className="ml-0.5 text-xs">ARS</span>
      </span>
      <span className="hidden text-muted-foreground lg:inline" aria-hidden>
        ·
      </span>
      <span className="hidden shrink-0 whitespace-nowrap text-muted-foreground lg:inline">
        {usd.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        <span className="ml-0.5 text-xs">USD</span>
      </span>
    </span>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex items-center gap-1.5">
        {showActivarIOX && onActivarIOX && (
          <button
            type="button"
            onClick={onActivarIOX}
            className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground hover:bg-gold/90"
          >
            Activar IOX
          </button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative z-10 cursor-default overflow-hidden rounded-lg border border-border bg-background px-2 py-1.5 shadow-sm lg:px-3">
              {line}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-semibold mb-1">Tu saldo en IOX</p>
            <p className="text-sm text-muted-foreground">
              {formatIX(saldoNum)} · ${saldoNum.toLocaleString("es-AR")} ARS · {usd.toLocaleString("es-AR", { maximumFractionDigits: 2 })} USD
            </p>
            {showActivarIOX && (
              <p className="text-xs text-muted-foreground mt-2">
                Podés activar el crédito IOX cuando quieras.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
