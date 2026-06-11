import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Mail, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { useMfaResendCooldown } from "@/hooks/use-mfa-resend-cooldown";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthDivider } from "@/components/auth/AuthDivider";

const Login = () => {
  const [searchParams] = useSearchParams();
  const sesionExpirada = searchParams.get("sesion") === "expirada";
  const { login, loginWithGoogle, mfaPending, completeLoginWithMfa, resendMfaCode, clearMfaPending } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const mfaInputRef = useRef<HTMLInputElement>(null);
  const { canResend, cooldownLabel } = useMfaResendCooldown(mfaPending?.resendAvailableAt);

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
    setResendMessage("");
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

  const handleResendMfa = async () => {
    if (!mfaPending?.mfaToken || !canResend || resendLoading) return;
    setError("");
    setResendMessage("");
    setResendLoading(true);
    try {
      await resendMfaCode();
      setMfaCode("");
      setResendMessage("Te enviamos un código nuevo. Revisá tu email y spam.");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error).message || "No se pudo reenviar el código");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGoogleLogin = async (credential: string) => {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404 && err.data?.code === 'GOOGLE_ACCOUNT_NOT_FOUND') {
          setError("No hay cuenta con ese Google. Creá una en registro o usá email y contraseña.");
        } else {
          setError(err.message);
        }
      } else {
        setError((err as Error).message || "Error al iniciar sesión con Google");
      }
    } finally {
      setGoogleLoading(false);
    }
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
                ? mfaPending?.sentTo
                  ? `Enviamos un código de 6 dígitos a ${mfaPending.sentTo}. Revisá también spam y promociones.`
                  : "Ingresá el código de 6 dígitos que te enviamos por email"
                : "Ingresá a tu cuenta para continuar"}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
            {sesionExpirada && !showMfaStep && (
              <div className="bg-muted/80 text-foreground p-3 rounded-lg text-sm border border-border">
                Tu sesión expiró o el token dejó de ser válido. Volvé a iniciar sesión para continuar.
              </div>
            )}
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {resendMessage && (
              <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-sm">
                {resendMessage}
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
                <div className="text-center text-sm text-muted-foreground">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => void handleResendMfa()}
                      disabled={resendLoading || loading}
                      className="text-gold hover:underline font-medium disabled:opacity-50"
                    >
                      {resendLoading ? "Reenviando..." : "Reenviar código"}
                    </button>
                  ) : (
                    <span>Podés reenviar el código en {cooldownLabel}</span>
                  )}
                </div>
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
              <>
                <GoogleSignInButton
                  onCredential={handleGoogleLogin}
                  onError={() => setError("No se pudo iniciar sesión con Google")}
                  disabled={loading || googleLoading}
                />
                {googleLoading && (
                  <p className="text-center text-sm text-muted-foreground">Conectando con Google...</p>
                )}
                <AuthDivider />
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
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                    <PasswordInput
                      id="password"
                      name="password"
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
              </>
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
