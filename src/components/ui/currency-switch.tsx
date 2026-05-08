import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CurrencySwitch = () => {
  const { variant, setVariant } = useCurrencyVariant();

  return (
    <div className="relative z-10 flex rounded-lg border border-border bg-muted/50 p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 rounded-md px-2 text-xs font-medium transition-colors lg:px-3",
          variant === 'IOX-ARS'
            ? "bg-background text-foreground ring-1 ring-border/80"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setVariant('IOX-ARS')}
      >
        IOX-ARS
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 rounded-md px-2 text-xs font-medium transition-colors lg:px-3",
          variant === 'IOX-USD'
            ? "bg-background text-foreground ring-1 ring-border/80"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setVariant('IOX-USD')}
      >
        IOX-USD
      </Button>
    </div>
  );
};
