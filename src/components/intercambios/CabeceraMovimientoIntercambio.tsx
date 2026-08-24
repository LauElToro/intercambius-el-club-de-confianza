import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { esCanjeRegistrado, esServicio, nombreItem } from "@/lib/publicacion";

type ItemMini = {
  id?: number;
  titulo?: string;
  imagen?: string;
  imagenPrincipal?: string;
  imagenes?: { url: string }[];
  rubro?: string;
};

function imgOf(item?: ItemMini | null): string | undefined {
  if (!item) return undefined;
  return item.imagenPrincipal || item.imagen || item.imagenes?.[0]?.url;
}

function Thumb({ item, alt }: { item?: ItemMini | null; alt: string }) {
  const src = imgOf(item);
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0 bg-secondary overflow-hidden">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-muted" />
      )}
    </div>
  );
}

export function CabeceraMovimientoIntercambio({
  item,
  otro,
  descripcion,
  modo,
  otroMarketItemId,
}: {
  item?: ItemMini | null;
  otro?: ItemMini | null;
  descripcion?: string;
  modo?: string | null;
  otroMarketItemId?: number | null;
}) {
  const esCanje = esCanjeRegistrado({ modo, otroMarketItem: otro, otroMarketItemId, descripcion });
  const tituloDestino = item?.titulo;
  const tituloOfrecido = otro?.titulo;
  const titulo =
    esCanje && tituloOfrecido && tituloDestino
      ? `${tituloOfrecido} ↔ ${tituloDestino}`
      : tituloDestino || descripcion || "Intercambio";
  const etiqueta = esCanje
    ? "Canje"
    : esServicio(item?.rubro)
      ? "Contratación"
      : "Compra";

  return (
    <div className="flex gap-3 min-w-0">
      {esCanje && otro ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <Thumb item={otro} alt={tituloOfrecido || "Ofrecido"} />
          <Repeat className="w-4 h-4 text-gold shrink-0" />
          <Thumb item={item} alt={tituloDestino || "Recibido"} />
        </div>
      ) : (
        <Thumb item={item} alt={titulo} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-base line-clamp-2">{titulo}</h3>
          <Badge variant="secondary" className="text-xs shrink-0">
            {etiqueta}
          </Badge>
        </div>
        {esCanje && !otro && descripcion && descripcion !== titulo && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{descripcion}</p>
        )}
        {!esCanje && item?.rubro && (
          <p className="text-xs text-muted-foreground mt-1 capitalize">{nombreItem(item.rubro)}</p>
        )}
      </div>
    </div>
  );
}
