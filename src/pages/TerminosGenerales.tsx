import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ArrowLeft } from "lucide-react";

const TerminosGenerales = () => {
  return (
    <Layout>
      <article className="container mx-auto px-4 max-w-3xl py-10 md:py-14 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <header className="mb-10">
          <p className="text-3xl mb-3" aria-hidden>
            📄
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            TÉRMINOS Y CONDICIONES GENERALES DE USO – INTERCAMBIUS
          </h1>
          <p className="mt-4 text-sm">
            <Link to="/terminos" className="text-gold hover:underline font-medium">
              Ver términos específicos del sistema IOX
            </Link>
          </p>
        </header>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Aceptación de los Términos
            </h2>
            <p>
              El acceso y uso de la plataforma Intercambius implica la aceptación plena de los
              presentes Términos y Condiciones. Si el usuario no está de acuerdo, deberá abstenerse
              de utilizar el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Definición del Servicio</h2>
            <p className="mb-4">
              Intercambius es una plataforma digital que facilita la conexión entre usuarios para el
              intercambio de bienes y servicios, pudiendo utilizar la unidad de cuenta interna IOX
              como medio de intercambio.
            </p>
            <p>
              Intercambius actúa exclusivamente como intermediario tecnológico y no forma parte de
              las transacciones entre usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Registro de Usuario</h2>
            <p className="mb-2 font-medium text-foreground">Para utilizar la plataforma, el usuario deberá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Proporcionar información veraz y actualizada.</li>
              <li>Mantener la confidencialidad de su cuenta.</li>
              <li>Ser responsable por toda actividad realizada bajo su usuario.</li>
            </ul>
            <p>Intercambius podrá suspender cuentas con información falsa o uso indebido.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Uso de la Plataforma</h2>
            <p className="mb-2 font-medium text-foreground">El usuario se compromete a:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Utilizar la plataforma de manera legal y de buena fe.</li>
              <li>Publicar información veraz sobre bienes y servicios.</li>
              <li>Cumplir con los acuerdos realizados con otros usuarios.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Queda prohibido:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Publicar contenido ilegal, engañoso o fraudulento.</li>
              <li>Utilizar la plataforma para estafas o actividades ilícitas.</li>
              <li>Suplantar identidad.</li>
              <li>Manipular el sistema o vulnerar la seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Publicaciones</h2>
            <p className="mb-2 font-medium text-foreground">Los usuarios son responsables de:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>La veracidad de sus publicaciones.</li>
              <li>La legalidad de los bienes o servicios ofrecidos.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Eliminar publicaciones que incumplan las normas.</li>
              <li>Moderar contenido sin previo aviso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Transacciones entre Usuarios
            </h2>
            <p className="mb-2 font-medium text-foreground">Las transacciones:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Son acuerdos directos entre usuarios.</li>
              <li>No implican responsabilidad de Intercambius.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Intercambius no garantiza:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cumplimiento de las operaciones.</li>
              <li>Calidad, seguridad o legalidad de lo intercambiado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Sistema IOX</h2>
            <p>
              El uso de IOX se rige por sus términos específicos, los cuales deben ser aceptados por
              separado. Podés consultarlos en{" "}
              <Link to="/terminos" className="text-gold font-medium hover:underline">
                Términos y condiciones de uso (IOX)
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Sistema de Reputación</h2>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Implementar sistemas de calificación.</li>
              <li>Ajustar visibilidad o límites según comportamiento.</li>
            </ul>
            <p>
              El usuario se compromete a utilizar este sistema de manera honesta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Suspensión y Cancelación de Cuenta
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Suspender o eliminar cuentas por incumplimiento.</li>
              <li>Restringir acceso ante actividad sospechosa.</li>
            </ul>
            <p>El usuario podrá solicitar la baja en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Propiedad Intelectual</h2>
            <p className="mb-4">
              Todo el contenido de la plataforma (marca, diseño, software) es propiedad de
              Intercambius o sus licenciantes.
            </p>
            <p className="mb-2 font-medium text-foreground">El usuario no podrá:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Copiar, modificar o distribuir sin autorización.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Protección de Datos</h2>
            <p className="mb-2 font-medium text-foreground">
              Intercambius podrá recolectar y utilizar datos personales con el fin de:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Operar la plataforma.</li>
              <li>Mejorar el servicio.</li>
              <li>Garantizar seguridad.</li>
            </ul>
            <p>El uso de datos se rige por la legislación vigente en Argentina.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              12. Limitación de Responsabilidad
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius no será responsable por:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Daños derivados del uso de la plataforma.</li>
              <li>Conflictos entre usuarios.</li>
              <li>Pérdidas económicas o de cualquier tipo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Modificaciones</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Intercambius podrá modificar estos términos en cualquier momento.</li>
              <li>El uso continuo implica aceptación de los cambios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">14. Legislación Aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República Argentina.</p>
          </section>

          {/* Políticas de uso */}
          <div className="pt-8 border-t border-border">
            <header className="mb-8">
              <p className="text-3xl mb-3" aria-hidden>
                📜
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                POLÍTICAS DE USO – INTERCAMBIUS
              </h2>
            </header>

            <div className="space-y-10">
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">1. Conducta del Usuario</h3>
                <p className="mb-2 font-medium text-foreground">Se espera que los usuarios:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Actúen con respeto y buena fe.</li>
                  <li>Cumplan lo acordado en cada intercambio.</li>
                  <li>Mantengan comunicación clara con otros usuarios.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">2. Contenido Prohibido</h3>
                <p className="mb-2 font-medium text-foreground">No está permitido publicar:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Bienes o servicios ilegales.</li>
                  <li>Contenido ofensivo, discriminatorio o violento.</li>
                  <li>Productos falsificados o robados.</li>
                  <li>Servicios engañosos o fraudulentos.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">3. Prácticas Abusivas</h3>
                <p className="mb-2 font-medium text-foreground">Queda prohibido:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Manipular precios artificialmente.</li>
                  <li>Generar actividad falsa.</li>
                  <li>Crear múltiples cuentas.</li>
                  <li>Abusar del sistema de reputación.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">4. Seguridad</h3>
                <p className="mb-2 font-medium text-foreground">El usuario es responsable de:</p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Proteger su cuenta y contraseña.</li>
                  <li>No compartir acceso con terceros.</li>
                </ul>
                <p className="mb-2 font-medium text-foreground">Intercambius recomienda:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Usar contraseñas seguras.</li>
                  <li>Reportar actividad sospechosa.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">5. Denuncias</h3>
                <p className="mb-2 font-medium text-foreground">Los usuarios pueden reportar:</p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Publicaciones indebidas.</li>
                  <li>Conductas sospechosas.</li>
                  <li>Incumplimientos.</li>
                </ul>
                <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Revisar y tomar medidas sin previo aviso.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">6. Sanciones</h3>
                <p className="mb-2 font-medium text-foreground">Ante incumplimientos, Intercambius podrá:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Advertir al usuario.</li>
                  <li>Limitar funcionalidades.</li>
                  <li>Suspender o eliminar cuentas.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  7. Cumplimiento Legal y Fiscal
                </h3>
                <p className="mb-2 font-medium text-foreground">Cada usuario es responsable de:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Cumplir con las leyes aplicables.</li>
                  <li>
                    Declarar y tributar en caso de corresponder ante AFIP u organismos pertinentes.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  8. Uso Responsable del Sistema
                </h3>
                <p className="mb-2 font-medium text-foreground">Intercambius promueve:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>El intercambio real de valor.</li>
                  <li>La circulación activa dentro del sistema.</li>
                  <li>La confianza entre usuarios.</li>
                </ul>
              </section>
            </div>
          </div>

          <footer className="pt-6 border-t border-border text-foreground font-medium">
            <p>El uso de la plataforma implica la aceptación de estas políticas.</p>
          </footer>
        </div>
      </article>
    </Layout>
  );
};

export default TerminosGenerales;
