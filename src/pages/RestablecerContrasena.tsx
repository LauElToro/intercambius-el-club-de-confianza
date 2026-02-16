import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Lock } from "lucide-react";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/lib/api";

const RestablecerContrasena = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!token) {
      setError("Enlace inválido");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, formData.newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo restablecer la contraseña. El enlace pudo haber expirado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (success) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-3 mb-4">
                <img src={logo} alt="Intercambius" className="h-12 w-12 rounded-full" />
                <span className="text-2xl font-semibold gold-text">Intercambius</span>
              </Link>
              <h1 className="text-3xl font-bold mb-2">Contraseña actualizada</h1>
              <p className="text-muted-foreground">
                Ya podés iniciar sesión con tu nueva contraseña.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <Button
                variant="gold"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Ir a iniciar sesión
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!token) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <p className="text-destructive mb-4">Enlace inválido o expirado.</p>
            <Link to="/olvide-contrasena">
              <Button variant="gold">Solicitar nuevo enlace</Button>
            </Link>
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
            <h1 className="text-3xl font-bold mb-2">Nueva contraseña</h1>
            <p className="text-muted-foreground">
              Elegí una contraseña segura de al menos 6 caracteres
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
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
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
                {loading ? "Guardando..." : "Restablecer contraseña"}
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

export default RestablecerContrasena;
