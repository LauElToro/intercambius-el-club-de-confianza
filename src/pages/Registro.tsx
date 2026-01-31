import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Sparkles, Mail, Lock, Phone } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    contacto: "",
    ofrece: "",
    necesita: "",
    precioOferta: "",
    ubicacion: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          contacto: formData.contacto,
          ofrece: formData.ofrece,
          necesita: formData.necesita,
          precioOferta: formData.precioOferta ? parseInt(formData.precioOferta) : undefined,
          ubicacion: formData.ubicacion || "CABA",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse");
      }

      // Hacer login automático después del registro
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        localStorage.setItem("intercambius_token", loginData.token);
        localStorage.setItem("intercambius_user", JSON.stringify(loginData.user));
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src={logo} alt="Intercambius" className="h-12 w-12 rounded-full" />
              <span className="text-2xl font-semibold gold-text">Intercambius</span>
            </Link>
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-gold" />
              <h1 className="text-3xl font-bold">Sumate al intercambio</h1>
            </div>
            <p className="text-muted-foreground">
              En 1 minuto estás adentro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto">¿Cómo te contactamos?</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="contacto"
                    name="contacto"
                    placeholder="+54 11 1234-5678 o email"
                    value={formData.contacto}
                    onChange={handleChange}
                    required
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
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
                <Label htmlFor="precioOferta">Precio de tu oferta (IX)</Label>
                <Input
                  id="precioOferta"
                  name="precioOferta"
                  type="number"
                  placeholder="100"
                  value={formData.precioOferta}
                  onChange={handleChange}
                  className="bg-surface border-border focus:border-gold"
                />
                <p className="text-xs text-muted-foreground">
                  Valor aproximado en IX de lo que ofrecés (1 IX = 1 peso argentino)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  name="ubicacion"
                  placeholder="Palermo, CABA"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className="bg-surface border-border focus:border-gold"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="gold" 
              size="xl" 
              className="w-full group"
              disabled={loading}
            >
              <Sparkles className="w-5 h-5" />
              {loading ? "Creando cuenta..." : "Crear mi cuenta"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-gold hover:underline font-medium">
                Iniciar sesión
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Al registrarte, aceptás formar parte de esta comunidad de intercambio
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Registro;
