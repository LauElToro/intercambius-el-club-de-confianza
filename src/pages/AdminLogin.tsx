import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-intercambius.jpeg";
import { Mail, Lock, Shield } from "lucide-react";
import { adminService, AdminApiError } from "@/services/admin.service";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await adminService.login(email, password);
      adminService.setToken(token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError("Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={logo} alt="Intercambius" className="h-12 w-12 rounded-full" />
            <span className="text-2xl font-semibold gold-text">Intercambius</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Shield className="w-5 h-5" />
            <span>Panel de administración</span>
          </div>
          <p className="text-sm text-muted-foreground">Ingresá con las credenciales de admin</p>
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
                  placeholder="admin@intercambius.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar al panel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
