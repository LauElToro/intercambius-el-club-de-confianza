import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader2, Receipt } from "lucide-react";
import { intercambiosService } from "@/services/intercambios.service";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";

function formatFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Historial = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: !!user,
  });

  const currentUser = userData || user;

  const { data: intercambios = [], isLoading } = useQuery({
    queryKey: ['intercambios', currentUser?.id],
    queryFn: () => intercambiosService.getByUserId(currentUser!.id!),
    enabled: !!currentUser?.id,
  });

  if (!currentUser) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  const esRecibido = (i: { usuarioId: number; creditos: number }) =>
    (i.usuarioId === currentUser.id && i.creditos > 0) ||
    (i.otraPersonaId === currentUser.id && i.creditos < 0);

  const otraPersona = (i: { usuarioId: number; otraPersonaId: number; otraPersonaNombre: string }) =>
    i.usuarioId === currentUser.id ? i.otraPersonaNombre : "Usuario";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Receipt className="w-8 h-8 text-gold" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mi historial</h1>
            <p className="text-muted-foreground">
              Todo lo que compraste, contrataste o vendiste
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : intercambios.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aún no tenés movimientos registrados.
              </p>
              <Button variant="gold" onClick={() => navigate("/registrar-intercambio")}>
                Registrar intercambio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...intercambios]
              .sort((a, b) => new Date(b.fecha || b.createdAt || 0).getTime() - new Date(a.fecha || a.createdAt || 0).getTime())
              .map((i) => {
                const recibido = esRecibido(i);
                const cantidad = Math.abs(i.creditos);
                const conQuien = otraPersona(i);
                return (
                  <Card key={i.id} className="hover:border-gold/30 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              recibido ? "bg-primary/10" : "bg-secondary"
                            }`}
                          >
                            {recibido ? (
                              <ArrowDownLeft className="w-6 h-6 text-primary" />
                            ) : (
                              <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {recibido ? "Recibiste" : "Pagaste"} {cantidad.toLocaleString('es-AR')} IX
                            </p>
                            <p className="text-sm text-muted-foreground">{i.descripcion}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {recibido ? `De: ${conQuien}` : `A: ${conQuien}`} • {formatFecha(i.fecha || i.createdAt || "")}
                            </p>
                            {i.estado && (
                              <Badge variant={i.estado === "confirmado" ? "default" : "secondary"} className="mt-2 text-xs">
                                {i.estado}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${recibido ? "text-primary" : "text-muted-foreground"}`}>
                          {recibido ? "+" : "-"}{cantidad} IX
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Historial;
