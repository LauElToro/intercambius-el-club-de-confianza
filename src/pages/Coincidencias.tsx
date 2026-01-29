import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Mock coincidencias
const mockCoincidencias = {
  teNecesitan: [
    {
      id: 1,
      nombre: "Juan Pérez",
      necesita: "Diseño gráfico para su emprendimiento",
      ofrece: "Clases de guitarra",
      contacto: "+54 11 1111-2222",
    },
    {
      id: 2,
      nombre: "Café del Centro",
      necesita: "Diseño de menú y cartelería",
      ofrece: "Consumiciones en el café",
      contacto: "cafe@email.com",
    },
  ],
  vosNecesitas: [
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      ofrece: "Reparación de computadoras",
      necesita: "Diseño gráfico",
      contacto: "+54 11 5555-1234",
    },
    {
      id: 4,
      nombre: "Laura Martínez",
      ofrece: "Clases de inglés",
      necesita: "Fotografía para portfolio",
      contacto: "laura@email.com",
    },
  ],
};

const Coincidencias = () => {
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const savedUser = localStorage.getItem("intercambius_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserName(user.nombre.split(" ")[0]);
    }
  }, []);

  const handleContactar = (contacto: string) => {
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
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Tus coincidencias
            </h1>
          </div>
          <p className="text-muted-foreground">
            Personas que podrían intercambiar con vos
          </p>
        </div>

        {/* Section: Te necesitan */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Te necesitan</h2>
              <p className="text-sm text-muted-foreground">
                Estas personas necesitan lo que vos ofrecés
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {mockCoincidencias.teNecesitan.map((item) => (
              <CoincidenciaCard
                key={item.id}
                nombre={item.nombre}
                highlight={item.necesita}
                secondary={item.ofrece}
                highlightLabel="Necesita"
                secondaryLabel="A cambio ofrece"
                type="necesita"
                onContactar={() => handleContactar(item.contacto)}
              />
            ))}
          </div>

          {mockCoincidencias.teNecesitan.length === 0 && (
            <EmptyState message="Todavía no hay nadie que necesite lo que ofrecés" />
          )}
        </section>

        {/* Section: Vos necesitás */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Ofrecen lo que necesitás</h2>
              <p className="text-sm text-muted-foreground">
                Estas personas ofrecen lo que vos estás buscando
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {mockCoincidencias.vosNecesitas.map((item) => (
              <CoincidenciaCard
                key={item.id}
                nombre={item.nombre}
                highlight={item.ofrece}
                secondary={item.necesita}
                highlightLabel="Ofrece"
                secondaryLabel="Necesita"
                type="ofrece"
                onContactar={() => handleContactar(item.contacto)}
              />
            ))}
          </div>

          {mockCoincidencias.vosNecesitas.length === 0 && (
            <EmptyState message="Todavía no encontramos quién ofrezca lo que necesitás" />
          )}
        </section>
      </div>
    </Layout>
  );
};

interface CoincidenciaCardProps {
  nombre: string;
  highlight: string;
  secondary: string;
  highlightLabel: string;
  secondaryLabel: string;
  type: "necesita" | "ofrece";
  onContactar: () => void;
}

const CoincidenciaCard = ({
  nombre,
  highlight,
  secondary,
  highlightLabel,
  secondaryLabel,
  type,
  onContactar,
}: CoincidenciaCardProps) => (
  <div className="bg-card rounded-xl border border-border p-5 hover:border-gold/30 transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
        <span className="font-bold gold-text">{nombre.charAt(0)}</span>
      </div>
      <span className="font-medium">{nombre}</span>
    </div>

    <div className="space-y-3 mb-4">
      <div className={`p-3 rounded-lg ${type === "necesita" ? "bg-primary/5 border border-primary/20" : "bg-secondary border border-border"}`}>
        <p className={`text-xs font-medium mb-1 ${type === "necesita" ? "text-primary" : "text-foreground"}`}>
          {highlightLabel}
        </p>
        <p className="text-sm">{highlight}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{secondaryLabel}</p>
        <p className="text-sm text-muted-foreground">{secondary}</p>
      </div>
    </div>

    <Button 
      variant="gold" 
      size="sm" 
      className="w-full"
      onClick={onContactar}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contactar
    </Button>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-card rounded-xl border border-border p-8 text-center">
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export default Coincidencias;
