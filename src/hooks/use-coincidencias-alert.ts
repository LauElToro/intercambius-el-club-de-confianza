import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { marketService } from "@/services/market.service";
import { buildTerminosInteres } from "@/lib/intereses-terminos";
import {
  MATCH_THRESHOLD_PRIMARY,
  itemMaxTablaScore,
} from "@/lib/fuzzy-interest-match";

const MARKET_POOL_LIMIT = 280;

/** Indica si hay coincidencias nuevas/no vistas para mostrar alerta en navegación. */
export function useCoincidenciasAlert() {
  const { user } = useAuth();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const usuario = currentUser ?? user;
  const terminosInteres = useMemo(
    () => buildTerminosInteres(usuario?.interesesQuiero ?? [], usuario?.necesita),
    [usuario?.interesesQuiero, usuario?.necesita]
  );

  const { data: pool } = useQuery({
    queryKey: ["marketItems", "coincidencias-alert-pool", usuario?.id],
    queryFn: () =>
      marketService.getItems({ page: 1, limit: MARKET_POOL_LIMIT, soloDisponibles: true }),
    enabled: !!usuario?.id && terminosInteres.length > 0,
    staleTime: 120_000,
  });

  const hayCoincidencias = useMemo(() => {
    if (!usuario?.id || terminosInteres.length === 0) return false;
    const rows = pool?.data ?? [];
    return rows.some((item) => {
      if (!item?.id || item.vendedorId === usuario.id || item.disponible === false) return false;
      const titulo = item.titulo ?? "";
      const desc = item.descripcion ?? "";
      return itemMaxTablaScore(terminosInteres, titulo, desc) >= MATCH_THRESHOLD_PRIMARY;
    });
  }, [pool?.data, terminosInteres, usuario?.id]);

  return { hayCoincidencias };
}
