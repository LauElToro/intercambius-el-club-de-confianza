import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Mock data
const mockOfertas = [
  {
    id: 1,
    nombre: "Carlos Rodríguez",
    ofrece: "Reparación de computadoras y celulares",
    necesita: "Diseño gráfico, fotografía",
    contacto: "+54 11 5555-1234",
  },
  {
    id: 2,
    nombre: "Laura Martínez",
    ofrece: "Clases de inglés y francés",
    necesita: "Clases de yoga, masajes",
    contacto: "laura@email.com",
  },
  {
    id: 3,
    nombre: "Panadería Don José",
    ofrece: "Pan casero, facturas, tortas",
    necesita: "Diseño de packaging, delivery",
    contacto: "+54 11 4444-5678",
  },
  {
    id: 4,
    nombre: "Ana Fernández",
    ofrece: "Clases de yoga y meditación",
    necesita: "Reparaciones del hogar, electricidad",
    contacto: "+54 11 3333-9012",
  },
  {
    id: 5,
    nombre: "Pedro Gómez",
    ofrece: "Plomería y electricidad",
    necesita: "Clases de idiomas, comida casera",
    contacto: "pedro.gomez@email.com",
  },
  {
    id: 6,
    nombre: "Sofía López",
    ofrece: "Fotografía profesional, edición de video",
    necesita: "Asesoría legal, contabilidad",
    contacto: "+54 11 2222-3456",
  },
];

const Ofertas = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "ofertas" | "necesidades">("todos");

  const filteredOfertas = mockOfertas.filter((item) => {
    const matchSearch = 
      item.nombre.toLowerCase().includes(search.toLowerCase()) ||
      item.ofrece.toLowerCase().includes(search.toLowerCase()) ||
      item.necesita.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleContactar = (contacto: string) => {
    // Simular contacto via WhatsApp
    if (contacto.startsWith("+")) {
      window.open(`https://wa.me/${contacto.replace(/\D/g, "")}`, "_blank");
    } else {
      window.open(`mailto:${contacto}`, "_blank");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Ofertas y demandas
          </h1>
          <p className="text-muted-foreground">
            Explorá qué ofrece y necesita la comunidad
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, oferta o necesidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface border-border"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "todos" ? "gold" : "outline"}
              size="sm"
              onClick={() => setFilter("todos")}
            >
              Todos
            </Button>
            <Button
              variant={filter === "ofertas" ? "gold" : "outline"}
              size="sm"
              onClick={() => setFilter("ofertas")}
            >
              <ArrowUpRight className="w-4 h-4 mr-1" />
              Ofertas
            </Button>
            <Button
              variant={filter === "necesidades" ? "gold" : "outline"}
              size="sm"
              onClick={() => setFilter("necesidades")}
            >
              <ArrowDownLeft className="w-4 h-4 mr-1" />
              Necesidades
            </Button>
          </div>
        </div>

        {/* Grid of cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfertas.map((item) => (
            <OfertaCard
              key={item.id}
              {...item}
              onContactar={() => handleContactar(item.contacto)}
            />
          ))}
        </div>

        {filteredOfertas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No encontramos resultados para "{search}"
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

interface OfertaCardProps {
  nombre: string;
  ofrece: string;
  necesita: string;
  onContactar: () => void;
}

const OfertaCard = ({ nombre, ofrece, necesita, onContactar }: OfertaCardProps) => (
  <div className="bg-card rounded-xl border border-border p-6 hover:border-gold/30 transition-all duration-300 hover:gold-glow flex flex-col">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
        <span className="text-xl font-bold gold-text">
          {nombre.charAt(0)}
        </span>
      </div>
      <h3 className="font-semibold">{nombre}</h3>
    </div>

    <div className="space-y-4 flex-1">
      <div>
        <div className="flex items-center gap-2 text-sm text-primary mb-1">
          <ArrowUpRight className="w-4 h-4" />
          <span className="font-medium">Ofrece</span>
        </div>
        <p className="text-muted-foreground text-sm">{ofrece}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <ArrowDownLeft className="w-4 h-4" />
          <span className="font-medium">Necesita</span>
        </div>
        <p className="text-muted-foreground text-sm">{necesita}</p>
      </div>
    </div>

    <Button 
      variant="gold-outline" 
      className="mt-6 w-full"
      onClick={onContactar}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contactar
    </Button>
  </div>
);

export default Ofertas;
