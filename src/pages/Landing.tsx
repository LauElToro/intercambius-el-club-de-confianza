import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo-intercambius.jpeg";
import { ArrowRight, Users, Repeat, Shield, Heart } from "lucide-react";

const Landing = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient" />
        
        {/* Decorative circles */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <img 
              src={logo} 
              alt="Intercambius" 
              className="w-32 h-32 mx-auto mb-8 rounded-full shadow-2xl animate-float"
            />
          </div>

          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Intercambiá bienes y servicios
            <br />
            <span className="gold-text">cuando el dinero no alcanza</span>
          </h1>

          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            Sistema de crédito mutuo con tokens respaldados. 
            Confianza organizada entre personas.
          </p>

          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Link to="/registro">
              <Button variant="gold" size="xl" className="group">
                Sumarme al intercambio
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/ofertas">
              <Button variant="gold-outline" size="xl">
                Ver qué se intercambia
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-surface/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Simple. Humano. Sin complicaciones.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Publicá lo tuyo"
              description="Contanos qué sabés hacer o qué tenés para ofrecer. Y también qué necesitás."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Encontrá coincidencias"
              description="Te mostramos quién ofrece lo que necesitás y quién necesita lo que ofrecés."
            />
            <FeatureCard
              icon={<Repeat className="w-8 h-8" />}
              title="Intercambiá"
              description="Acordá el intercambio, registralo, y listo. Tu saldo se ajusta automáticamente."
            />
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Shield className="w-12 h-12 text-gold mb-6" />
                <h2 className="text-3xl font-bold mb-4">
                  El valor lo crean las personas
                </h2>
                <p className="text-muted-foreground mb-6">
                  Intercambius es un club de intercambio digital. Cada miembro aporta 
                  valor real: su trabajo, sus productos, sus servicios.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-gold rounded-full" />
                    Token respaldado
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-gold rounded-full" />
                    Para intercambios dentro del club
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-gold rounded-full" />
                    Confianza organizada entre personas
                  </li>
                </ul>
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border gold-glow">
                <div className="text-center">
                  <p className="text-6xl font-bold gold-text mb-2">∞</p>
                  <p className="text-xl font-medium mb-4">Sistema de suma cero</p>
                  <p className="text-muted-foreground text-sm">
                    Cuando alguien recibe, otro da. El sistema siempre está en equilibrio. 
                    Tu crédito se genera cuando aportás valor a la comunidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-surface/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para intercambiar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sumate a la comunidad. Intercambiá aunque no tengas pesos.
          </p>
          <Link to="/registro">
            <Button variant="gold" size="xl" className="group">
              Crear mi cuenta gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Intercambius" className="w-8 h-8 rounded-full" />
              <span className="text-sm text-muted-foreground">
                Intercambius © 2026
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Token respaldado. Confianza organizada.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card rounded-2xl p-8 border border-border hover:border-gold/30 transition-all duration-300 hover:gold-glow">
    <div className="text-gold mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Landing;
