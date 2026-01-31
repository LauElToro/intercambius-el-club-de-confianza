import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { ArrowUpRight, ArrowDownLeft, Edit, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Obtener datos actualizados del usuario
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;

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

  const saldoPositivo = currentUser.saldo >= 0;
  const porcentajeCredito = Math.abs(currentUser.saldo) / currentUser.limite * 100;

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
                  {saldoPositivo ? '+' : ''}{currentUser.saldo}
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
                <span className="text-gold">{Math.abs(currentUser.saldo)}</span>
                <span className="text-muted-foreground"> / {currentUser.limite} IX</span>
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
          <ProfileCard
            title="Mis productos/servicios"
            content={currentUser.ofrece || "Aún no has creado ningún producto o servicio. ¡Crea uno ahora!"}
            icon={<ArrowUpRight className="w-5 h-5 text-primary" />}
            type="productos"
          />
          <Link to="/market" className="block">
            <ProfileCard
              title="Explorar marketplace"
              content="Descubrí productos y servicios disponibles en la comunidad"
              icon={<ArrowDownLeft className="w-5 h-5 text-muted-foreground" />}
              type="market"
            />
          </Link>
        </div>

        {/* Recent activity (mock) */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Últimos movimientos</h2>
          <div className="space-y-3">
            <ActivityItem
              type="recibido"
              description="Diseño de logo para Juan Pérez"
              amount={80}
              date="Hace 3 días"
            />
            <ActivityItem
              type="enviado"
              description="Clase de inglés con Ana López"
              amount={50}
              date="Hace 1 semana"
            />
            <ActivityItem
              type="recibido"
              description="Flyer para emprendimiento"
              amount={40}
              date="Hace 2 semanas"
            />
          </div>
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
