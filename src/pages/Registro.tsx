import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Sparkles } from "lucide-react";

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    ofrece: "",
    necesita: "",
    contacto: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock: guardamos en localStorage para simular registro
    localStorage.setItem("intercambius_user", JSON.stringify({
      ...formData,
      saldo: 0,
      limite: 500,
      id: Date.now(),
    }));
    navigate("/dashboard");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src={logo} 
              alt="Intercambius" 
              className="w-20 h-20 mx-auto mb-6 rounded-full shadow-xl"
            />
            <h1 className="text-3xl font-bold mb-2">Sumate al intercambio</h1>
            <p className="text-muted-foreground">
              En 1 minuto estás adentro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nombre">¿Cómo te llamás?</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Tu nombre o el de tu emprendimiento"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ofrece">¿Qué ofrecés?</Label>
                <Textarea
                  id="ofrece"
                  name="ofrece"
                  placeholder="Ej: Diseño gráfico, clases de inglés, tortas caseras..."
                  value={formData.ofrece}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Contanos qué sabés hacer o qué productos tenés
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="necesita">¿Qué necesitás?</Label>
                <Textarea
                  id="necesita"
                  name="necesita"
                  placeholder="Ej: Reparación de computadoras, clases de cocina..."
                  value={formData.necesita}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  ¿Qué te vendría bien conseguir?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto">¿Cómo te contactamos?</Label>
                <Input
                  id="contacto"
                  name="contacto"
                  placeholder="WhatsApp o email"
                  value={formData.contacto}
                  onChange={handleChange}
                  required
                  className="bg-surface border-border focus:border-gold"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gold" 
              size="xl" 
              className="w-full group"
            >
              <Sparkles className="w-5 h-5" />
              Crear mi cuenta
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Al registrarte, aceptás formar parte de esta comunidad de intercambio
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Registro;
