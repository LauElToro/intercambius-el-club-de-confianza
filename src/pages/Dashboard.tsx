import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { ArrowUpRight, ArrowDownLeft, Edit, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { intercambiosService } from "@/services/intercambios.service";
import { marketService } from "@/services/market.service";
import { Loader2 } from "lucide-react";

function formatFechaRelativa(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${diffDays >= 14 ? "s" : ""}`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${diffDays >= 60 ? "es" : ""}`;
  return `Hace ${Math.floor(diffDays / 365)} año${diffDays >= 730 ? "s" : ""}`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;

  const { data: intercambios = [] } = useQuery({
    queryKey: ['intercambios', currentUser?.id],
    queryFn: () => intercambiosService.getByUserId(currentUser!.id!),
    enabled: !!currentUser?.id,
  });

  const { data: misProductos = [] } = useQuery({
    queryKey: ['marketItems', 'mis-productos', currentUser?.id],
    queryFn: () => marketService.getItems({ vendedorId: currentUser!.id! }),
    enabled: !!currentUser?.id,
  });

  if (authLoading || userLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const saldo = Number(currentUser.saldo) || 0;
  const limite = Number(currentUser.limite) || 150000;
  const saldoPositivo = saldo >= 0;
  const porcentajeCredito = limite > 0 ? Math.abs(saldo) / limite * 100 : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Hola, {currentUser.nombre.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            Este es tu espacio en Intercambius
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-card rounded-2xl p-6 md:p-8 border border-border gold-glow mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-muted-foreground mb-2">Tu saldo actual</p>
              <div className="flex items-baseline gap-2">
              <span className={`text-5xl md:text-6xl font-bold ${saldoPositivo ? 'gold-text' : 'text-destructive'}`}>
                  {saldoPositivo ? '+' : ''}{saldo}
                </span>
                <span className="text-2xl text-muted-foreground">IX</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {saldoPositivo 
                  ? "Tenés créditos para usar"
                  : "Debés créditos a la comunidad"}
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-muted-foreground mb-2">Límite de crédito</p>
              <div className="w-full md:w-48 bg-surface rounded-full h-3 mb-2">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-gold to-gold-light transition-all"
                  style={{ width: `${Math.min(porcentajeCredito, 100)}%` }}
                />
              </div>
              <p className="text-sm text-foreground">
                <span className="text-gold">{Math.abs(saldo)}</span>
                <span className="text-muted-foreground"> / {limite} IX</span>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-gold/50 rounded-full" />
              IX = Créditos de Intercambius. No es dinero real, es valor de intercambio.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/crear-producto">
            <Button variant="gold" size="lg" className="w-full h-auto py-4 flex flex-col gap-1">
              <Plus className="w-5 h-5" />
              <span>Crear producto/servicio</span>
            </Button>
          </Link>
          <Link to="/registrar-intercambio">
            <Button variant="gold-outline" size="lg" className="w-full h-auto py-4 flex flex-col gap-1">
              <Plus className="w-5 h-5" />
              <span>Registrar intercambio</span>
            </Button>
          </Link>
          <Link to="/coincidencias">
            <Button variant="gold-outline" size="lg" className="w-full h-auto py-4 flex flex-col gap-1">
              <ArrowRight className="w-5 h-5" />
              <span>Ver coincidencias</span>
            </Button>
          </Link>
        </div>

        {/* Profile Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/mis-publicaciones" className="block">
            <ProfileCard
              title="Mis productos/servicios"
              content={misProductos.length > 0 
                ? `Tenés ${misProductos.length} producto${misProductos.length !== 1 ? 's' : ''} publicado${misProductos.length !== 1 ? 's' : ''}. ¡Editá o agregá más!`
                : "Aún no has creado ningún producto o servicio. ¡Crea uno ahora!"}
              icon={<ArrowUpRight className="w-5 h-5 text-primary" />}
              type="productos"
            />
          </Link>
          <Link to="/market" className="block">
            <ProfileCard
              title="Explorar marketplace"
              content="Descubrí productos y servicios disponibles en la comunidad"
              icon={<ArrowDownLeft className="w-5 h-5 text-muted-foreground" />}
              type="market"
            />
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Últimos movimientos</h2>
            <Link to="/historial">
              <Button variant="ghost" size="sm">Ver historial completo</Button>
            </Link>
          </div>
          {intercambios.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">
              Aún no tenés movimientos. Registrá un intercambio para verlo acá.
            </p>
          ) : (
            <div className="space-y-3">
              {intercambios
                .sort((a, b) => new Date(b.fecha || b.createdAt || 0).getTime() - new Date(a.fecha || a.createdAt || 0).getTime())
                .slice(0, 10)
                .map((i) => (
                  <ActivityItem
                    key={i.id}
                    type={i.creditos > 0 ? "recibido" : "enviado"}
                    description={i.descripcion}
                    amount={Math.abs(i.creditos)}
                    date={formatFechaRelativa(i.fecha || i.createdAt || "")}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

interface ProfileCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  type: string;
}

const ProfileCard = ({ title, content, icon }: ProfileCardProps) => (
  <div className="bg-card rounded-xl p-6 border border-border hover:border-gold/30 transition-colors group">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit className="w-4 h-4" />
      </Button>
    </div>
    <p className="text-muted-foreground">{content}</p>
  </div>
);

interface ActivityItemProps {
  type: "recibido" | "enviado";
  description: string;
  amount: number;
  date: string;
}

const ActivityItem = ({ type, description, amount, date }: ActivityItemProps) => (
  <div className="bg-card rounded-lg p-4 border border-border flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        type === "recibido" ? "bg-primary/10" : "bg-secondary"
      }`}>
        {type === "recibido" 
          ? <ArrowDownLeft className="w-5 h-5 text-primary" />
          : <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
        }
      </div>
      <div>
        <p className="font-medium text-sm">{description}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
    <span className={`font-semibold ${type === "recibido" ? "text-primary" : "text-muted-foreground"}`}>
      {type === "recibido" ? "+" : "-"}{amount} IX
    </span>
  </div>
);

export default Dashboard;
