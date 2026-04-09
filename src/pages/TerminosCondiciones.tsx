import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ArrowLeft } from "lucide-react";

const TerminosCondiciones = () => {
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
            TÉRMINOS Y CONDICIONES DE USO – INTERCAMBIUS (IOX)
          </h1>
          <p className="mt-4 text-sm">
            <Link to="/terminos-generales" className="text-gold hover:underline font-medium">
              Ver términos generales y políticas de uso
            </Link>
          </p>
        </header>

        <div className="space-y-12 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Definición del Servicio
            </h2>
            <p className="mb-4">
              Intercambius es una plataforma digital que permite a usuarios intercambiar bienes y
              servicios utilizando una unidad de cuenta interna denominada IOX (Intercambius
              Exchange Unit).
            </p>
            <p className="mb-2 font-medium text-foreground">Los IOX:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>No constituyen dinero de curso legal.</li>
              <li>No son convertibles a moneda de curso legal ni a ninguna otra moneda.</li>
              <li>No generan intereses ni rendimiento financiero.</li>
              <li>Funcionan exclusivamente como medio de intercambio dentro del ecosistema Intercambius.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Naturaleza de los IOX</h2>
            <p className="mb-2 font-medium text-foreground">El usuario acepta que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Los IOX son créditos de intercambio y no un activo financiero.</li>
              <li>No pueden ser comprados ni vendidos por dinero.</li>
              <li>No representan una inversión ni instrumento especulativo.</li>
              <li>Su valor es relacional y surge de acuerdos entre usuarios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Creación y Asignación de IOX
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Asignar IOX iniciales a nuevos usuarios.</li>
              <li>Emitir IOX como incentivo por actividad dentro de la plataforma.</li>
              <li>Ajustar saldos en función del comportamiento del sistema.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">El usuario acepta que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>No posee derecho adquirido sobre la emisión futura de IOX.</li>
              <li>Intercambius puede modificar en cualquier momento la política monetaria interna.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Uso Permitido</h2>
            <p className="mb-2 font-medium text-foreground">Los usuarios pueden:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Publicar bienes y servicios.</li>
              <li>Acordar precios en IOX libremente.</li>
              <li>Realizar transacciones dentro de la plataforma.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">No está permitido:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Convertir IOX a dinero fuera del sistema.</li>
              <li>Utilizar IOX como mecanismo de evasión fiscal.</li>
              <li>Simular transacciones para manipular reputación o saldos.</li>
              <li>Transferir o vender cuentas de usuario.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Sistema de Saldos</h2>
            <p className="mb-2 font-medium text-foreground">Los usuarios pueden:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Mantener saldo positivo o negativo, según lo permita el sistema.</li>
              <li>Operar dentro de límites definidos por Intercambius.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Establecer límites de crédito y deuda.</li>
              <li>Ajustar dichos límites según comportamiento o reputación.</li>
              <li>Congelar cuentas ante conductas irregulares.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Responsabilidad de las Transacciones
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                No garantiza la calidad, seguridad o legalidad de los bienes y servicios ofrecidos.
              </li>
              <li>Actúa únicamente como intermediario tecnológico.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Los usuarios:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Son responsables de cumplir los acuerdos que realizan.</li>
              <li>Deben resolver disputas de buena fe entre las partes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Sistema de Reputación</h2>
            <p className="mb-2 font-medium text-foreground">La plataforma podrá incluir:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Calificaciones entre usuarios.</li>
              <li>Historial de transacciones.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Penalizar conductas abusivas o fraudulentas.</li>
              <li>Limitar la capacidad operativa según reputación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Prevención de Abuso y Fraude
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Auditar transacciones.</li>
              <li>Revertir operaciones sospechosas.</li>
              <li>Suspender o eliminar cuentas.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">
              Se consideran prácticas prohibidas, entre otras:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Auto-transacciones para generar IOX.</li>
              <li>Redes coordinadas para inflar precios o actividad.</li>
              <li>Creación de múltiples cuentas por un mismo usuario.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Política Monetaria del Sistema
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Emitir o retirar IOX del sistema.</li>
              <li>
                Aplicar mecanismos de equilibrio, incluyendo ajustes de saldos, incentivos o
                expiraciones.
              </li>
            </ul>
            <p className="mb-2 font-medium text-foreground">El objetivo es:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Mantener la estabilidad del ecosistema.</li>
              <li>Favorecer la circulación de IOX como medio de intercambio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Suspensión y Terminación
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius podrá:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Suspender cuentas por incumplimiento de estos términos.</li>
              <li>Eliminar saldos en casos de fraude comprobado.</li>
              <li>Cerrar cuentas inactivas.</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">El usuario podrá:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Solicitar la baja de su cuenta en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. Limitación de Responsabilidad
            </h2>
            <p className="mb-2 font-medium text-foreground">Intercambius no será responsable por:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Pérdidas derivadas de intercambios entre usuarios.</li>
              <li>Incumplimientos entre partes.</li>
              <li>Uso indebido de la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Modificaciones</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Intercambius podrá modificar estos términos en cualquier momento.</li>
              <li>El uso continuado de la plataforma implica aceptación de dichas modificaciones.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              13. Marco Legal Aplicable
            </h2>
            <p className="mb-4">
              El presente sistema se encuadra dentro de las normas del Código Civil y Comercial de
              la Nación Argentina, en particular en lo relativo a:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                Contratos de permuta (trueque), donde las partes intercambian bienes o servicios
                sin necesidad de dinero.
              </li>
              <li>
                Autonomía de la voluntad contractual, permitiendo a las partes fijar libremente las
                condiciones del intercambio.
              </li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Asimismo, los usuarios reconocen que:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                Las operaciones realizadas pueden estar alcanzadas por obligaciones fiscales según la
                normativa vigente.
              </li>
              <li>
                Cada usuario es responsable de cumplir con sus obligaciones ante la Administración
                Federal de Ingresos Públicos (AFIP) u organismos correspondientes.
              </li>
            </ul>
            <p>
              Intercambius no actúa como agente de percepción, intermediario financiero ni entidad
              regulada, sino como plataforma tecnológica de facilitación de intercambios.
            </p>
          </section>

          <footer className="pt-6 border-t border-border text-foreground font-medium">
            <p>
              Al utilizar IOX dentro de Intercambius, el usuario declara haber leído y aceptado la
              totalidad de los presentes términos y condiciones.
            </p>
          </footer>
        </div>
      </article>
    </Layout>
  );
};

export default TerminosCondiciones;
