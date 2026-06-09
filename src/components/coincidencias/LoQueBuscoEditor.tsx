import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  isTermFromInteresesQuiero,
  removeTermFromNecesita,
  terminoYaCargado,
} from "@/lib/intereses-terminos";

const MAX_INTERESES = 25;
const MIN_CHARS = 2;

type LoQueBuscoEditorProps = {
  /** Términos activos (interesesQuiero + lo que busco del perfil). */
  terminosActivos: string[];
  interesesQuiero: string[];
  necesita?: string;
};

export function LoQueBuscoEditor({
  terminosActivos,
  interesesQuiero,
  necesita,
}: LoQueBuscoEditorProps) {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const guardarMutation = useMutation({
    mutationFn: (data: { interesesQuiero?: string[]; necesita?: string }) =>
      userService.updateUser(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await refreshUser();
    },
    onError: (err: unknown) => {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Intentá de nuevo",
        variant: "destructive",
      });
    },
  });

  const agregar = () => {
    const raw = input.trim().slice(0, 80);
    if (raw.length < MIN_CHARS) return;
    if (terminoYaCargado(terminosActivos, raw)) {
      setInput("");
      return;
    }
    if (terminosActivos.length >= MAX_INTERESES) {
      toast({
        title: "Límite alcanzado",
        description: `Podés cargar hasta ${MAX_INTERESES} palabras.`,
        variant: "destructive",
      });
      return;
    }
    guardarMutation.mutate({ interesesQuiero: [...interesesQuiero, raw] });
    setInput("");
  };

  const quitar = (tag: string) => {
    if (isTermFromInteresesQuiero(interesesQuiero, tag)) {
      guardarMutation.mutate({
        interesesQuiero: interesesQuiero.filter((t) => t.toLowerCase() !== tag.toLowerCase()),
      });
      return;
    }
    guardarMutation.mutate({
      necesita: removeTermFromNecesita(necesita, tag),
    });
  };

  const sinPalabras = terminosActivos.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2rem] items-center">
        {guardarMutation.isPending && sinPalabras ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : sinPalabras ? (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Sin palabras cargadas
          </Badge>
        ) : (
          terminosActivos.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1 font-normal">
              {tag}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted disabled:opacity-50"
                onClick={() => quitar(tag)}
                disabled={guardarMutation.isPending}
                aria-label={`Quitar ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          placeholder="Ej: pantalón, zapatillas, guitarra…"
          maxLength={80}
          className="flex-1"
          disabled={guardarMutation.isPending}
        />
        <Button
          type="button"
          variant={sinPalabras ? "gold" : "outline"}
          size="sm"
          onClick={agregar}
          disabled={guardarMutation.isPending || input.trim().length < MIN_CHARS}
          className="shrink-0 gap-2"
        >
          {guardarMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          Agregar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Hasta {MAX_INTERESES} palabras, mínimo {MIN_CHARS} caracteres. Coincidencia ~70 % con título o descripción.
      </p>
    </div>
  );
}
