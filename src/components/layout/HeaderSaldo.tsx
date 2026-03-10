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
}

/** Muestra saldo en IX y equivalentes en ARS y USD en el header */
export const HeaderSaldo = ({ saldo }: HeaderSaldoProps) => {
  const { formatIX } = useCurrencyVariant();
  const saldoNum = Number(saldo) || 0;
  const usd = saldoNum / IX_PESOS_PER_USD;

  const line = (
    <span className="flex items-center gap-2 text-sm font-medium">
      <span className="text-gold whitespace-nowrap">{formatIX(saldoNum)}</span>
      <span className="text-muted-foreground hidden sm:inline" aria-hidden>
        ·
      </span>
      <span className="text-muted-foreground hidden sm:inline whitespace-nowrap">
        ${saldoNum.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
        <span className="text-xs ml-0.5">ARS</span>
      </span>
      <span className="text-muted-foreground hidden md:inline" aria-hidden>
        ·
      </span>
      <span className="text-muted-foreground hidden md:inline whitespace-nowrap">
        {usd.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        <span className="text-xs ml-0.5">USD</span>
      </span>
    </span>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 cursor-default">
            {line}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold mb-1">Tu saldo en IX</p>
          <p className="text-sm text-muted-foreground">
            {formatIX(saldoNum)} · ${saldoNum.toLocaleString("es-AR")} ARS · {usd.toLocaleString("es-AR", { maximumFractionDigits: 2 })} USD
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
