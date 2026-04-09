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

const Registro = () => {
  const { register } = useAuth();
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
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
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

    if (!recaptchaVerified) {
      setError("Por favor, completa el reCAPTCHA");
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

  const handleRecaptcha = (token: string | null) => {
    setRecaptchaVerified(!!token);
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Código de referido (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="codigoReferido">Código de referido (opcional)</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="codigoReferido"
                    name="codigoReferido"
                    autoComplete="off"
                    placeholder="Si alguien te invitó, pegá su código o enlace"
                    value={formData.codigoReferido}
                    onChange={handleChange}
                    className="pl-10 bg-surface border-border focus:border-gold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  También podés entrar con un link que incluya <span className="font-mono">?ref=...</span>
                </p>
              </div>

              {/* Email */}
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

              {/* Teléfono */}
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

              {/* Contraseña */}
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

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
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

              {/* Ubicación con mapa */}
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

              {/* Aceptación de términos */}
              <div className="space-y-3 rounded-lg border border-border bg-surface/50 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="aceptaTerminos"
                    checked={aceptaTerminos}
                    onCheckedChange={(v) => setAceptaTerminos(v === true)}
                    className="mt-0.5 border-gold/60 data-[state=checked]:bg-gold data-[state=checked]:border-gold data-[state=checked]:text-primary-foreground"
                    aria-required="true"
                  />
                  <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
                    <Label htmlFor="aceptaTerminos" className="cursor-pointer font-normal text-muted-foreground">
                      Declaro haber leído y acepto los{" "}
                      <Link
                        to="/terminos-generales"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        términos y condiciones generales y políticas de uso
                      </Link>{" "}
                      y los{" "}
                      <Link
                        to="/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        términos y condiciones del sistema IOX
                      </Link>
                      .
                    </Label>
                  </div>
                </div>
              </div>

              {/* reCAPTCHA - Placeholder por ahora */}
              <div className="space-y-2">
                <Label>Verificación *</Label>
                <div className="flex items-center gap-2 p-4 bg-surface rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="recaptcha"
                    checked={recaptchaVerified}
                    onChange={(e) => setRecaptchaVerified(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="recaptcha" className="text-sm text-muted-foreground cursor-pointer">
                    No soy un robot (reCAPTCHA se implementará)
                  </label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="xl"
              className="w-full group"
              disabled={loading || !aceptaTerminos || !recaptchaVerified}
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
