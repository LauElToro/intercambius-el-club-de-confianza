import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  COMISION_IOX_PORCENTAJE,
  CREDITO_OFERTA_INGRESO,
  MESES_REGULARIZACION_DEUDA,
  SALDO_POSITIVO_MAX_IOX,
} from "@/lib/constants";

const fmt = (n: number) => n.toLocaleString("es-AR");

const DisenoEconomico = () => {
  return (
    <Layout>
      <article className="container mx-auto max-w-3xl px-4 py-10 pb-24 md:py-14">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <header className="mb-12 border-b border-border pb-8">
          <p className="mb-2 text-3xl" aria-hidden>
            📄
          </p>
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Intercambius
          </p>
          <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
            Diseño económico y antifraude
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Versión final · Documento de referencia</p>
        </header>

        <div className="space-y-14 text-muted-foreground leading-relaxed">
          {/* Resumen */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Resumen ejecutivo</h2>
            <p className="mb-4">
              Intercambius es una red de intercambio basada en una moneda complementaria (IOX),
              diseñada exclusivamente para facilitar transacciones de bienes y servicios entre
              usuarios.
            </p>
            <p className="mb-2 font-medium text-foreground">A diferencia del dinero tradicional:</p>
            <ul className="mb-4 list-disc space-y-1 pl-5">
              <li>no genera interés</li>
              <li>no funciona como reserva de valor</li>
              <li>no puede ser comprada</li>
              <li>no busca acumulación</li>
            </ul>
            <p className="mb-4">
              El sistema opera bajo un modelo de <strong className="text-foreground">crédito mutuo</strong>, donde cada
              transacción genera simultáneamente un saldo positivo y uno negativo, manteniendo
              equilibrio interno.
            </p>
            <p className="mb-4">
              El valor de la moneda no proviene de su escasez, sino de la{" "}
              <strong className="text-foreground">actividad real de la red</strong>.
            </p>
            <p className="rounded-lg border border-gold/30 bg-gold/5 p-4 text-foreground">
              El objetivo del sistema es <strong>maximizar la circulación</strong>, no la acumulación.
            </p>
          </section>

          {/* Definiciones */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Diseño económico · Definiciones previas</h2>
            <p className="mb-4">
              <strong className="text-foreground">IOX</strong> es nuestra moneda complementaria. Se emite cuando una
              transacción está por suceder o efectivamente sucede: lo que respalda la emisión es la
              misma red —las interacciones.
            </p>
            <p className="mb-4">
              Las transacciones son al IOX lo que fue el patrón oro al dinero fiduciario (dólar, peso,
              etc.) hasta 1971, o lo que son las reservas en dólares para el peso argentino.
            </p>
            <p className="mb-4">
              Retomamos el uso que el dinero tiene como{" "}
              <strong className="text-foreground">vehículo de intercambio</strong> que facilita y hace posible el trueque
              de forma más sencilla. El &quot;dinero formal&quot; que usamos a diario suele ser solo un
              vehículo para intercambiar horas de trabajo por bienes y servicios; sobre esa misma
              moneda existe toda una arquitectura financiera.
            </p>
            <p className="mb-4">
              Lo que proponemos es separarnos de esa lógica: una moneda que es{" "}
              <strong className="text-foreground">solo para intercambiar</strong> construye una red que complementa la
              economía formal, con ventajas claras.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Ventajas del sistema</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Tasa de interés nula · costo financiero nulo</li>
              <li>No existe interés compuesto</li>
              <li>No se generan ni se pagan impuestos dentro del sistema</li>
              <li>El sistema no depende del fisco</li>
              <li>Las rentas financieras no aplican</li>
              <li>La emisión no responde a la lógica clásica de oferta y demanda</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Unidad de cuenta</h3>
            <p className="mb-4">En Intercambius:</p>
            <ul className="mb-4 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">1 IOX = 1 peso</strong> (unidad de referencia fija)
              </li>
              <li>
                <strong className="text-foreground">1 IOXD = 1 USD</strong> (unidad de referencia fija)
              </li>
            </ul>
            <p className="mb-2">
              Esta paridad no es negociable ni flotante. No existe cotización ni arbitraje. El IOX no
              es una moneda de inversión, sino una herramienta para ordenar el intercambio dentro de
              la red.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              La emisión de moneda complementaria y el valor
            </h3>
            <p className="mb-4">
              En el sistema tradicional, emitir más dinero tiende a reducir su valor. En Intercambius
              ocurre lo contrario: <strong className="text-foreground">a mayor emisión ligada a transacciones reales, mayor
              actividad y valor del sistema</strong>. Siguiendo enfoques de autores como Bernard Lietaer,
              Silvio Gesell y otros, planteamos una lógica invertida respecto al dinero tradicional.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Economía formal</p>
                <p className="text-sm">más emisión → posible pérdida de valor</p>
              </div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
                <p className="text-sm font-medium text-foreground">Intercambius</p>
                <p className="text-sm">
                  más emisión → más transacciones → más actividad → más valor real
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Base monetaria en Intercambius</h3>
            <p className="mb-4">
              Si en el sistema tradicional la base monetaria se relaciona con el circulante y su
              respaldo, en Intercambius la base monetaria está respaldada directamente por el{" "}
              <strong className="text-foreground">volumen de transacciones</strong>.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>si aumenta la emisión → es porque aumentan las transacciones</li>
              <li>si aumentan las transacciones → crece la red</li>
              <li>si crece la red → aumenta el valor del sistema</li>
            </ul>
            <p className="mt-4">
              Es un sistema simétrico con la economía real que genera. Cuanto más se emite la moneda
              complementaria y más es aceptada, más valor tiene —porque la emisión ocurre con cada
              transacción: más moneda implica más transacciones y más valor real.
            </p>
            <p className="mt-4">
              El desfasaje con la economía formal tiene muchas causas; una central, como explicaba
              Gesell, es el <strong className="text-foreground">interés compuesto</strong>.
            </p>
          </section>

          {/* Interés compuesto */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">El interés compuesto</h3>
            <p className="mb-4">
              Si alguien invierte USD 100 al 10% anual, al primer año obtiene USD 110; al segundo, el
              10% se aplica sobre 110 → USD 121; al tercero USD 133,1… Es un crecimiento{" "}
              <strong className="text-foreground">exponencial</strong>: el dinero genera dinero. En Intercambius no
              aplicamos esa lógica.
            </p>
            <p className="mb-2 font-medium text-foreground">📈 Fórmula de interés compuesto</p>
            <p className="mb-2 text-sm">
              <span className="font-mono text-foreground">A = P × (1 + r)</span>
              <sup>t</sup>
            </p>
            <p className="mb-4 text-sm">
              Donde <em>P</em> es el capital (ej. 100 USD), <em>r</em> la tasa (ej. 0,10),{" "}
              <em>t</em> los años. El exponente <em>t</em> acelera el crecimiento como una potencia
              (no es lineal como el cuadrado fijo: el exponente es la cantidad de años).
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Años</TableHead>
                    <TableHead>Cálculo</TableHead>
                    <TableHead className="text-right">Resultado (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    [5, "100 × (1,10)⁵", "161"],
                    [10, "100 × (1,10)¹⁰", "259"],
                    [20, "100 × (1,10)²⁰", "673"],
                    [50, "100 × (1,10)⁵⁰", "11.739"],
                    [100, "100 × (1,10)¹⁰⁰", "1.378.061"],
                  ].map(([años, calc, res]) => (
                    <TableRow key={años}>
                      <TableCell>{años}</TableCell>
                      <TableCell className="font-mono text-xs">{calc}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{res}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-sm">
              Este armado favorece a quienes poseen capital. En Intercambius el crecimiento no es
              exponencial financiero sino ligado a intercambios reales; cada emisión va asociada a
              bienes o servicios.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">💰 ¿Quién paga el interés compuesto?</h3>
            <p className="mb-4">Siempre lo paga alguien: no se crea dinero &quot;mágicamente&quot;.</p>
            <p className="mb-2 font-medium text-foreground">🧠 Caso 1: Economía real (productiva)</p>
            <p className="mb-2 text-sm">
              Si el capital está en empresas, negocios, tecnología productiva, el interés lo
              sostienen clientes, crecimiento y productividad.
            </p>
            <p className="mb-4 font-medium text-foreground">⚠️ Caso 2: Sistema financiero / deuda</p>
            <p className="mb-2 text-sm">
              Créditos, tarjetas, préstamos: lo pagan personas endeudadas, empresas, Estados e
              impuestos; muchas veces la gente común.
            </p>
            <p className="mb-2 font-medium text-foreground">🔥 Problema estructural</p>
            <p className="text-sm">
              Si el sistema depende demasiado del interés compuesto, la deuda crece en exponencial
              pero la economía real no al mismo ritmo: aparecen deuda atrapada, transferencia de
              riqueza y concentración. Los recursos reales (naturales, horas de trabajo) son finitos;
              la matemática financiera puede pretender infinito.{" "}
              <strong className="text-foreground">Esa lógica no aplica en nuestro sistema.</strong>
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">💡 El valor intrínseco de nuestra moneda</h3>
            <p className="mb-4">
              La moneda complementaria no genera valor por sí sola: solo facilita el intercambio. No
              tiene sentido acumularla esperando rendimiento. Por eso{" "}
              <strong className="text-foreground">no permitimos comprar IOX con dinero formal</strong>: rompería la lógica.
              Cada unidad debe asociarse a una transacción real entre participantes.
            </p>
            <blockquote className="border-l-4 border-gold pl-4 text-foreground">
              La moneda solo se emite contra bienes y servicios reales dentro del sistema.
            </blockquote>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Sistema de suma cero, como el trueque
            </h3>
            <p className="mb-4">
              El dinero no se crea de forma externa al intercambio: está balanceado en la red. Cada
              compra genera saldo negativo para quien compra y positivo para quien vende; en conjunto,
              el total suma cero. El valor surge del intercambio, no del paso del tiempo ni del
              interés.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Intercambius como actor del sistema
            </h3>
            <p className="mb-4">
              Intercambius no es solo plataforma: es un participante activo, en un rol análogo a un
              &quot;banco de IOX&quot; <strong className="text-foreground">sin lógica de interés tradicional</strong>.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Facilitar la creación de IOX vía transacciones</li>
              <li>Participar ofreciendo y demandando bienes y servicios</li>
              <li>Absorber IOX en eventos y actividades propias</li>
              <li>Contribuir al equilibrio general</li>
            </ul>
            <p className="mt-4">
              No persigue acumular IOX como fin, sino sostenibilidad y circulación de la red.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">
              Integración con economía formal
            </h3>
            <p className="mb-4">
              Intercambius es complementario, no excluyente. Las operaciones pueden combinarse: parte
              en IOX dentro de la plataforma y parte en pesos o dólares por fuera.
            </p>
            <p className="mb-2 font-medium text-foreground">Regla base (referencia operativa)</p>
            <p className="mb-4">
              Toda operación debe incluir un mínimo del{" "}
              <strong className="text-foreground">{COMISION_IOX_PORCENTAJE}% en IOX</strong>. El resto puede acordarse
              libremente en moneda tradicional. Intercambius no es intermediario de pagos en moneda
              formal: actúa como plataforma de intercambio (trueque digital).
            </p>
            <p className="text-sm">
              Si el usuario alcanza su límite negativo, puede operar en moneda tradicional pero debe
              regularizar su saldo IOX según las reglas del sistema.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Indicadores del sistema</h3>
            <p className="mb-4">
              Entre otros: base monetaria IOX, volumen de transacciones, flujo neto, velocidad de
              circulación. El objetivo no es maximizar la emisión sino{" "}
              <strong className="text-foreground">maximizar la circulación</strong>.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 font-semibold text-foreground">Índice de Salud del Sistema (ISS)</p>
              <p className="mb-2 font-mono text-sm text-foreground">
                ISS = (Volumen de transacciones / IOX total emitido) × % de usuarios activos
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>ISS alto → circulación y actividad real altas</li>
                <li>ISS bajo → acumulación, baja actividad o estancamiento</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Sistema de crédito inicial</h3>
            <p className="mb-4">
              Cada usuario puede acceder a crédito. Límite base de referencia: hasta{" "}
              <strong className="text-foreground">{fmt(CREDITO_OFERTA_INGRESO)} IOX</strong> de saldo negativo. La
              moneda se crea cuando hay transacción real.
            </p>
            <p className="mb-2 font-medium text-foreground">Asignación según oferta (ejemplo)</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm">
              <li>publicás por $20.000 → hasta 20.000 IOX de línea relacionada</li>
              <li>publicás por $100.000 → hasta {fmt(CREDITO_OFERTA_INGRESO)} IOX (tope)</li>
            </ul>
            <p className="mb-2 font-medium text-foreground">Activación progresiva</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>registro → sin crédito liberado hasta completar pasos</li>
              <li>publicaciones → incrementos</li>
              <li>ventas → incrementos</li>
              <li>KYC → mayor habilitación</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Regularización y límites</h3>
            <p className="mb-4">
              Si un usuario mantiene deuda (ej. -{fmt(CREDITO_OFERTA_INGRESO)} IOX) por más de{" "}
              <strong className="text-foreground">{MESES_REGULARIZACION_DEUDA} meses</strong>, puede activarse un proceso
              de regularización: publicar y vender, colaborar con ONGs (jornadas), apoyar actividades
              de Intercambius, etc. Las deudas se compensan con actividad real.
            </p>
            <p>
              <strong className="text-foreground">Límite de saldo positivo (referencia):</strong> máximo acumulable del
              orden de {fmt(SALDO_POSITIVO_MAX_IOX)} IOX; el excedente puede ser auditado o bloqueado según políticas
              operativas.
            </p>
          </section>

          {/* Antifraude */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Diseño estructural antifraude</h2>
            <p className="mb-4">
              Un grupo con KYC puede coordinar ventas ficticias, concentrar millones de IOX y luego
              comprar algo real (&quot;collusion ring&quot;). El KYC ayuda pero no basta: hace falta diseño
              que impida que un grupo pequeño fabrique poder de compra.
            </p>
            <p className="mb-4 font-medium text-foreground">
              Regla operativa: antes de operaciones sensibles, el usuario completa verificación /
              enganche en el momento oportuno para reducir abuso.
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Diversidad de compradores:</strong> a mayor saldo positivo, más
                contrapartes distintas requeridas.
              </li>
              <li>
                <strong className="text-foreground">Detección de colusión:</strong> operaciones repetidas, redes
                cerradas, flujos circulares; si &gt;70% del volumen es del mismo grupo → alerta.
              </li>
              <li>
                <strong className="text-foreground">Límite de repeticiones</strong> entre los mismos usuarios.
              </li>
              <li>
                <strong className="text-foreground">Sistema de confianza:</strong> operaciones, reputación, tiempo,
                denuncias.
              </li>
              <li>
                <strong className="text-foreground">Referidos responsables:</strong> beneficios si el referido genera
                actividad real (venta/compra), con publicaciones y uso genuino.
              </li>
              <li>
                <strong className="text-foreground">Beneficios fundadores:</strong> mayor crédito, visibilidad,
                prioridad, uso gratuito de por vida —siempre alineados a circulación real.
              </li>
            </ul>
            <p className="rounded-lg border border-gold/30 bg-gold/5 p-4 font-medium text-foreground">
              Principio clave: un grupo pequeño no puede generar poder de compra sin interactuar con
              toda la red.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Principios del sistema</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>No hay emisión sin transacción</li>
              <li>No hay crédito sin oferta real</li>
              <li>No hay consumo sin devolución al sistema</li>
              <li>El valor no se acumula, se intercambia</li>
              <li>El crecimiento no es financiero, es económico</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Resultado y objetivos</h3>
            <p className="mb-4">
              Con este diseño se reduce la colusión, se fuerza la circulación real, se mantiene el
              equilibrio y la moneda se alinea con la economía real.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Evitar colusión coordinada</li>
              <li>Forzar circulación real</li>
              <li>Hacer sostenible la moneda y alinear emisión con uso</li>
            </ul>
            <p className="mt-6 text-sm">
              Para el marco legal aplicable y responsabilidades de usuarios, ver también{" "}
              <Link to="/terminos-generales" className="font-medium text-gold hover:underline">
                términos generales
              </Link>{" "}
              y{" "}
              <Link to="/terminos" className="font-medium text-gold hover:underline">
                términos IOX
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </Layout>
  );
};

export default DisenoEconomico;
