import { useCurrencyVariant } from "@/contexts/CurrencyVariantContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CurrencySwitch = () => {
  const { variant, setVariant } = useCurrencyVariant();

  return (
    <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs font-medium rounded-md transition-colors",
          variant === 'IOX-ARS' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setVariant('IOX-ARS')}
      >
        IOX-ARS
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs font-medium rounded-md transition-colors",
          variant === 'IOX-USD' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setVariant('IOX-USD')}
      >
        IOX-USD
      </Button>
    </div>
  );
};
