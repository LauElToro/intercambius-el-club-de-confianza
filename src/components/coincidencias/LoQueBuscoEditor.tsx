import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MAX_INTERESES = 25;
const MIN_CHARS = 2;

type LoQueBuscoEditorProps = {
  interesesQuiero: string[];
};

export function LoQueBuscoEditor({ interesesQuiero }: LoQueBuscoEditorProps) {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const guardarMutation = useMutation({
    mutationFn: (lista: string[]) => userService.updateUser({ interesesQuiero: lista }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
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

  const persistir = (lista: string[]) => {
    guardarMutation.mutate(lista);
  };

  const agregar = () => {
    const raw = input.trim().slice(0, 80);
    if (raw.length < MIN_CHARS) return;
    const duplicado = interesesQuiero.some((t) => t.toLowerCase() === raw.toLowerCase());
    if (duplicado) {
      setInput("");
      return;
    }
    if (interesesQuiero.length >= MAX_INTERESES) {
      toast({
        title: "Límite alcanzado",
        description: `Podés cargar hasta ${MAX_INTERESES} palabras.`,
        variant: "destructive",
      });
      return;
    }
    persistir([...interesesQuiero, raw]);
    setInput("");
  };

  const quitar = (tag: string) => {
    persistir(interesesQuiero.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[2rem] items-center">
        {guardarMutation.isPending && interesesQuiero.length === 0 ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : interesesQuiero.length === 0 ? (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            Sin palabras cargadas
          </Badge>
        ) : (
          interesesQuiero.map((tag) => (
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
          variant={interesesQuiero.length === 0 ? "gold" : "outline"}
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
