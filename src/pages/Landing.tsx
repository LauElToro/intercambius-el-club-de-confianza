import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { LANDING_BANNER_LIGHT, BRAND_LOGO_URL } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

const Landing = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-fade-in mb-8" style={{ animationDelay: "0.1s" }}>
            <img
              src={BRAND_LOGO_URL}
              alt="Intercambius"
              className="mx-auto hidden h-auto w-full max-w-[220px] object-contain drop-shadow-2xl md:max-w-[260px] dark:block"
            />
            <img
              src={LANDING_BANNER_LIGHT}
              alt="Intercambius"
              className="mx-auto block h-auto w-full max-w-md object-contain md:max-w-xl dark:hidden"
            />
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            Intercambiá lo que tenés por lo que necesitás
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in"
            style={{ animationDelay: "0.25s" }}
          >
            Empezá ahora mismo a intercambiar valor real, sin comisiones y sin depender
            siempre del dinero.
          </p>

          <div
            className="flex flex-col items-center gap-4 animate-fade-in"
            style={{ animationDelay: "0.35s" }}
          >
            <Link to="/registro">
              <Button variant="gold" size="xl" className="group">
                <span className="mr-1" aria-hidden>
                  👉
                </span>
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-gold font-medium hover:underline underline-offset-2">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ¿Qué es este sitio? */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            ¿Qué es este sitio?
          </h2>
          <p className="text-muted-foreground text-center md:text-lg leading-relaxed mb-8">
            Intercambius es una red de intercambio donde podés comprar y vender productos o
            servicios usando créditos (IOX) en lugar de depender solo del dinero. Cuando
            vendés algo, recibís créditos. Cuando necesitás algo, usás esos créditos con
            cualquier persona dentro de la red.
          </p>
          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border gold-glow">
            <p className="font-semibold text-foreground mb-3">Referencias claras</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-gold shrink-0">📌</span>
                <span>
                  <strong className="text-foreground">1 IOX = 1 peso</strong>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold shrink-0">📌</span>
                <span>
                  <strong className="text-foreground">1 IOXD = 1 USD</strong>
                </span>
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground text-sm md:text-base">
              Además, podés combinar créditos + dinero si querés completar un intercambio.
            </p>
          </div>
        </div>
      </section>

      {/* ¿Por qué usar Intercambius? */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Por qué usar Intercambius?
          </h2>
          <ul className="space-y-4 text-lg">
            <li className="flex gap-3 items-start">
              <span className="text-2xl shrink-0" aria-hidden>
                💰
              </span>
              <span>Gastás menos dinero en lo que necesitás</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-2xl shrink-0" aria-hidden>
                🔄
              </span>
              <span>Convertís lo que no usás en valor real</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-2xl shrink-0" aria-hidden>
                🤝
              </span>
              <span>Accedés a nuevas oportunidades y personas</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-2xl shrink-0" aria-hidden>
                ⚡
              </span>
              <span>Más simple y flexible que el trueque tradicional</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ¿Para qué usarlo? */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            ¿Para qué usarlo?
          </h2>
          <ul className="space-y-3 text-muted-foreground md:text-lg">
            <li className="flex gap-3">
              <span className="text-gold shrink-0">•</span>
              <span>Conseguir productos o servicios sin pagar todo en efectivo</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold shrink-0">•</span>
              <span>Aprovechar cosas que ya tenés (objetos, tiempo o habilidades)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold shrink-0">•</span>
              <span>Generar nuevas oportunidades personales o comerciales</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold shrink-0">•</span>
              <span>Resolver necesidades del día a día de forma más inteligente</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <ol className="space-y-8">
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-bold">
                1
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-1">Publicás lo que ofrecés</h3>
                <p className="text-muted-foreground">Un producto, un servicio o una habilidad.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-bold">
                2
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-1">Vendés y recibís créditos</h3>
                <p className="text-muted-foreground">
                  Ejemplo: vendés una bici y recibís 200.000 IOX.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-bold">
                3
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-1">Usás esos créditos</h3>
                <p className="text-muted-foreground">
                  Los gastás en lo que necesites dentro de la red.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-bold">
                4
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-1">Opcional: combinás con dinero</h3>
                <p className="text-muted-foreground">
                  También podés comprar incluso si todavía no vendiste nada.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-12 bg-card rounded-2xl p-6 md:p-8 border border-border">
            <p className="font-semibold text-foreground mb-4">Ejemplo real</p>
            <p className="text-muted-foreground mb-4">
              Querés comprar una bici que vale 200.000. Intercambius te presta 50.000 IOX (sin
              interés). Pagás los 150.000 restantes en pesos.
            </p>
            <div className="rounded-xl bg-muted/50 p-4 border border-border/60">
              <p className="flex gap-2 items-start text-sm md:text-base">
                <span aria-hidden>💡</span>
                <span>
                  Esa deuda en IOX no genera interés. Y más adelante, cuando vendas algo dentro
                  de la red, la podés cancelar con tus propios créditos.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Para quién es? */}
      <section className="py-20 bg-surface/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Para quién es?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-gold/30 transition-colors">
              <p className="text-2xl mb-2" aria-hidden>
                🏪
              </p>
              <h3 className="text-xl font-semibold mb-4">Si tenés un negocio</h3>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li>Movés stock o capacidad ociosa</li>
                <li>Conseguís nuevos clientes</li>
                <li>Pagás servicios sin usar tanto efectivo</li>
              </ul>
              <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                <p className="font-medium text-foreground mb-2 flex gap-2 items-start">
                  <span aria-hidden>💡</span>
                  Acceso a crédito sin costo financiero
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Podés recibir créditos IOX a tasa 0%. Sin interés, porque operás en moneda
                  complementaria. Un equipo especializado se pone en contacto con vos para
                  evaluarlo.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-gold/30 transition-colors">
              <p className="text-2xl mb-2" aria-hidden>
                👤
              </p>
              <h3 className="text-xl font-semibold mb-4">Si sos usuario</h3>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li>Intercambiás cosas que no usás</li>
                <li>Ofrecés tus habilidades</li>
                <li>Accedés a productos y servicios gastando menos dinero</li>
              </ul>
              <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                <p className="font-medium text-foreground mb-2 flex gap-2 items-start">
                  <span aria-hidden>💡</span>
                  Crédito inicial para empezar
                </p>
                <p className="text-sm text-muted-foreground">
                  Podés acceder a hasta 50.000 IOX (equivalente a $50.000) para que empieces a
                  operar dentro de la red desde el primer día.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿Esto es seguro? */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ¿Esto es seguro? ¿Por qué funciona?
          </h2>
          <ul className="space-y-5 text-muted-foreground md:text-lg">
            <li className="flex gap-3 items-start">
              <span className="text-xl shrink-0" aria-hidden>
                🔒
              </span>
              <span>
                <strong className="text-foreground">No es dinero, es crédito interno:</strong>{" "}
                los IOX solo se usan dentro de la red, para intercambiar valor real entre
                personas.
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-xl shrink-0" aria-hidden>
                ⚖️
              </span>
              <span>
                <strong className="text-foreground">Equivalencia clara:</strong> 1 IOX = 1 peso,
                lo que hace que los precios sean fáciles de entender.
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-xl shrink-0" aria-hidden>
                🤝
              </span>
              <span>
                <strong className="text-foreground">Basado en intercambio real:</strong> cada
                crédito nace de una operación entre usuarios, no de especulación.
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-xl shrink-0" aria-hidden>
                📊
              </span>
              <span>
                <strong className="text-foreground">Sistema equilibrado:</strong> lo que uno
                gasta, otro lo recibe — mantiene el flujo dentro de la comunidad.
              </span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-xl shrink-0" aria-hidden>
                🧠
              </span>
              <span>
                <strong className="text-foreground">Crédito inteligente:</strong> los préstamos
                en IOX no tienen interés porque se cancelan generando valor dentro de la red.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* En una frase */}
      <section className="py-16 bg-surface/50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            En una frase
          </h2>
          <blockquote className="text-xl md:text-2xl font-medium text-foreground leading-relaxed max-w-xl mx-auto border-t-4 border-gold pt-6">
            Intercambius convierte lo que tenés en lo que necesitás, sin depender completamente
            del dinero.
          </blockquote>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-3xl mb-2" aria-hidden>
            🚀
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Empezá ahora</h2>
          <p className="text-muted-foreground mb-8 md:text-lg">
            Intercambiá valor real, accedé a crédito sin interés y aprovechá lo que ya tenés.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link to="/registro">
              <Button variant="gold" size="xl" className="group">
                <span className="mr-1" aria-hidden>
                  👉
                </span>
                Crear cuenta gratis y empezar a intercambiar
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-gold font-medium hover:underline underline-offset-2">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer marca */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={BRAND_LOGO_URL} alt="Intercambius" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm text-muted-foreground">Intercambius © 2026</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right space-y-1">
              <p>Créditos IOX · Red de intercambio</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center md:justify-end">
                <Link to="/economia" className="text-gold hover:underline font-medium">
                  Diseño económico
                </Link>
                <Link to="/terminos-generales" className="text-gold hover:underline font-medium">
                  Términos generales y políticas
                </Link>
                <Link to="/terminos" className="text-gold hover:underline font-medium">
                  Términos IOX
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Landing;
