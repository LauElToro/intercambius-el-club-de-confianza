import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  className?: string;
  /** Tamaño del ícono en Tailwind (ej. h-4 w-4) */
  iconClassName?: string;
};

/**
 * Insignia compacta: identidad verificada con Didit (KYC).
 */
export function IdentidadVerificadaBadge({ className = "", iconClassName = "h-4 w-4" }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center justify-center rounded-full text-emerald-500 ${className}`}
            aria-label="Identidad verificada"
          >
            <BadgeCheck className={iconClassName} strokeWidth={2.25} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          Identidad verificada (KYC)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
