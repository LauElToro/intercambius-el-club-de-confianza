import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Mail } from "lucide-react";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/lib/api";

const OlvideContrasena = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo enviar el email. Probá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-3 mb-4">
                <img src={logo} alt="Intercambius" className="h-12 w-12 rounded-full" />
                <span className="text-2xl font-semibold gold-text">Intercambius</span>
              </Link>
              <h1 className="text-3xl font-bold mb-2">Revisá tu email</h1>
              <p className="text-muted-foreground">
                Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿No lo ves? Revisá la carpeta de spam o volvé a intentar.
              </p>
              <Link to="/login">
                <Button variant="gold" className="w-full">
                  Volver al inicio de sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src={logo} alt="Intercambius" className="h-12 w-12 rounded-full" />
              <span className="text-2xl font-semibold gold-text">Intercambius</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">¿Olvidaste tu contraseña?</h1>
            <p className="text-muted-foreground">
              Ingresá tu email y te enviamos un enlace para restablecerla
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar enlace"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
              <Link to="/login" className="text-gold hover:underline font-medium">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OlvideContrasena;
