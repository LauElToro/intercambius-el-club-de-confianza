import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Mail, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

const Login = () => {
  const { login, mfaPending, completeLoginWithMfa, clearMfaPending } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mfaInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error).message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaPending?.mfaToken || mfaCode.length !== 6) {
      setError("Ingresá el código de 6 dígitos que te enviamos por email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await completeLoginWithMfa(mfaPending.mfaToken, mfaCode);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error).message || "Código inválido");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const showMfaStep = mfaPending != null;

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src={logo} alt="Intercambius" className="h-12 w-12 rounded-full" />
              <span className="text-2xl font-semibold gold-text">Intercambius</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              {showMfaStep ? "Código de verificación" : "Iniciar sesión"}
            </h1>
            <p className="text-muted-foreground">
              {showMfaStep
                ? "Ingresá el código de 6 dígitos que te enviamos por email"
                : "Ingresá a tu cuenta para continuar"}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {showMfaStep ? (
              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="mfaCode">Código</Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      ref={mfaInputRef}
                      id="mfaCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={mfaCode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setMfaCode(v);
                      }}
                      maxLength={6}
                      className="pl-10 bg-surface border-border focus:border-gold text-center text-lg tracking-[0.5em]"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={loading || mfaCode.length !== 6}
                >
                  {loading ? "Verificando..." : "Verificar y entrar"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={clearMfaPending}
                  disabled={loading}
                >
                  Volver al inicio de sesión
                </Button>
              </form>
            ) : (
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
                      className="pl-10 bg-surface border-border focus:border-gold"
                    />
                  </div>
                  <div className="text-right">
                    <Link to="/olvide-contrasena" className="text-sm text-gold hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            {!showMfaStep && (
              <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
                ¿No tenés cuenta?{" "}
                <Link to="/registro" className="text-gold hover:underline font-medium">
                  Registrate acá
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
