import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Sparkles, Mail, Lock, Phone, User, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { LocationPicker } from "@/components/location/LocationPicker";
import { ReCaptchaField } from "@/components/auth/ReCaptchaField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthDivider } from "@/components/auth/AuthDivider";

const Registro = () => {
  const { register, registerWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    ubicacion: "",
    radioBusqueda: 20,
    codigoReferido: "",
  });

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      const decoded = decodeURIComponent(ref.trim());
      setFormData((prev) => ({ ...prev, codigoReferido: decoded }));
    }
  }, [searchParams]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!aceptaTerminos) {
      setError("Debés aceptar los términos y condiciones para crear tu cuenta.");
      return;
    }

    if (!recaptchaToken) {
      setError("Por favor, completá el reCAPTCHA");
      return;
    }

    setLoading(true);

    try {
      await register({
        nombre: `${formData.nombre} ${formData.apellido}`.trim(),
        email: formData.email,
        password: formData.password,
        contacto: formData.telefono,
        ubicacion: formData.ubicacion,
        aceptaTerminos: true,
        codigoReferido: formData.codigoReferido.trim() || undefined,
        recaptchaToken,
      });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Error al registrarse");
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

  const handleGoogleRegister = async (credential: string) => {
    setError("");
    setGoogleLoading(true);
    try {
      await registerWithGoogle(credential, {
        codigoReferido: formData.codigoReferido.trim() || undefined,
        ubicacion: formData.ubicacion || undefined,
        contacto: formData.telefono || undefined,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error).message || "Error al registrarse con Google");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Mismo padding horizontal que la tarjeta (p-6) para alinear título y campos */}
          <header className="mb-8 flex w-full flex-col items-center px-6 text-center">
            <Link to="/" className="mb-4 flex items-center justify-center gap-3">
              <img src={logo} alt="Intercambius" className="h-12 w-12 shrink-0 rounded-full" />
              <span className="text-2xl font-semibold gold-text">Intercambius</span>
            </Link>
            <div className="mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 shrink-0 text-gold" />
              <h1 className="text-3xl font-bold">Crear cuenta</h1>
            </div>
            <p className="text-muted-foreground">
              Completá tus datos para empezar a intercambiar
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6 px-6">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <GoogleSignInButton
                align="start"
                onCredential={handleGoogleRegister}
                onError={() => setError("No se pudo iniciar sesión con Google")}
                disabled={loading || googleLoading}
              />
              <p className="text-left text-xs text-muted-foreground">
                Al registrarte con Google aceptás los{" "}
                <Link to="/terminos-generales" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                  términos generales
                </Link>{" "}
                y los{" "}
                <Link to="/terminos" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                  términos IOX
                </Link>
                .
              </p>
              {(loading || googleLoading) && (
                <p className="text-left text-sm text-muted-foreground">
                  {googleLoading ? "Conectando con Google..." : "Creando cuenta..."}
                </p>
              )}
            </div>

            <AuthDivider />

            <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground">Datos personales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="nombre"
                        name="nombre"
                        placeholder="Juan"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className="pl-10 bg-surface border-border focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="apellido"
                        name="apellido"
                        placeholder="Pérez"
                        value={formData.apellido}
                        onChange={handleChange}
                        required
                        className="pl-10 bg-surface border-border focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
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
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        placeholder="+54 11 1234-5678"
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                        className="pl-10 bg-surface border-border focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">Referido (opcional)</h2>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="codigoReferido"
                    name="codigoReferido"
                    autoComplete="off"
                    placeholder="Código o enlace de quien te invitó"
                    value={formData.codigoReferido}
                    onChange={handleChange}
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground">Contraseña</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="pl-10 bg-surface border-border focus:border-gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                      <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Repetí tu contraseña"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="pl-10 bg-surface border-border focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <LocationPicker
                value={formData.ubicacion}
                onChange={(location, lat, lng, radius) => {
                  setFormData(prev => ({
                    ...prev,
                    ubicacion: location,
                    radioBusqueda: radius || prev.radioBusqueda,
                  }));
                }}
                radius={formData.radioBusqueda}
                onRadiusChange={(radius) => {
                  setFormData(prev => ({ ...prev, radioBusqueda: radius }));
                }}
                label="Ubicación"
                required
              />

              <section className="space-y-4">
                <div className="rounded-lg border border-border bg-surface/50 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="aceptaTerminos"
                      checked={aceptaTerminos}
                      onCheckedChange={(v) => setAceptaTerminos(v === true)}
                      className="mt-0.5 border-gold/60 data-[state=checked]:bg-gold data-[state=checked]:border-gold data-[state=checked]:text-primary-foreground"
                      aria-required="true"
                    />
                    <Label htmlFor="aceptaTerminos" className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground">
                      Acepto los{" "}
                      <Link
                        to="/terminos-generales"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        términos generales
                      </Link>{" "}
                      y los{" "}
                      <Link
                        to="/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        términos IOX
                      </Link>
                      .
                    </Label>
                  </div>
                </div>

                <ReCaptchaField onTokenChange={setRecaptchaToken} />
              </section>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="xl"
              className="w-full group"
              disabled={loading || googleLoading || !aceptaTerminos || !recaptchaToken}
            >
              {loading ? "Creando cuenta..." : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Crear cuenta
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-gold hover:underline font-medium">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Registro;
