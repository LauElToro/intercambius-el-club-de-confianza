import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle, Repeat } from "lucide-react";

const RegistrarIntercambio = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    otraPersona: "",
    descripcion: "",
    creditos: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: solo mostramos confirmación
    setSubmitted(true);
    
    // Actualizar saldo mock
    const savedUser = localStorage.getItem("intercambius_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      user.saldo += parseInt(formData.creditos) || 0;
      localStorage.setItem("intercambius_user", JSON.stringify(user));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">¡Intercambio registrado!</h1>
            <p className="text-muted-foreground mb-8">
              Tu saldo fue actualizado. Gracias por ser parte de la comunidad.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="gold" 
                onClick={() => navigate("/dashboard")}
              >
                Ver mi saldo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    otraPersona: "",
                    descripcion: "",
                    creditos: "",
                    fecha: new Date().toISOString().split("T")[0],
                  });
                }}
              >
                Registrar otro intercambio
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Repeat className="w-6 h-6 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Registrar intercambio
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Anotá un intercambio que hiciste con otra persona
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otraPersona">¿Con quién intercambiaste?</Label>
                <Input
                  id="otraPersona"
                  name="otraPersona"
                  placeholder="Nombre de la otra persona"
                  value={formData.otraPersona}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">¿Qué intercambiaron?</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  placeholder="Ej: Le hice un diseño de logo a cambio de una clase de inglés"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditos">Créditos (IX)</Label>
                  <Input
                    id="creditos"
                    name="creditos"
                    type="number"
                    placeholder="Ej: 50"
                    value={formData.creditos}
                    onChange={handleChange}
                    required
                    className="bg-surface border-border focus:border-gold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Positivo si recibiste, negativo si diste
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                    className="bg-surface border-border focus:border-gold"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gold" 
              size="lg" 
              className="w-full group"
            >
              Confirmar intercambio
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ambas personas deben registrar el intercambio para que quede asentado
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrarIntercambio;
