import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { COMO_FUNCIONA, MARCO_LEGAL, PRODUCTO, RECURSOS } from "@/lib/config";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA GUÍA DE USO — pedida por Edgardo el 17/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Textual: *"redactar una guía de uso orientada a destacar las capacidades del
 *  sistema, sus proyecciones y de dónde salen sus recursos"*.
 *
 *  🔑 **No está escrita para una familia, está escrita para quien EVALÚA.** Una
 *  familia aprende usando el producto —para eso está el recorrido y para eso
 *  está el tour—; el que llega a juzgarlo en diez minutos necesita otra cosa:
 *  qué hace, qué explícitamente no hace, hacia dónde va, y de dónde sale cada
 *  número que el sistema muestra.
 *
 *  🔴 **La sección más importante es «Lo que NO hace».** Un sistema que sólo
 *  enumera capacidades se lee como un folleto; éste se sostiene justamente en
 *  que dice dónde termina. Si alguna vez hay que recortar esta página, esa
 *  sección es la última que se toca.
 *
 *  ⚠ **Acá no entra ni una cifra que no esté citada.** Todas salen de lo que ya
 *  usa el motor, con la fuente al lado — es la regla del proyecto, y en esta
 *  página es además el argumento.
 */

export const metadata = {
  title: "Guía de AntiGro — qué hace, qué no, y de dónde sale cada dato",
};

/* ── Piezas chicas, para que el contenido se lea y no se pierda en clases ──── */

function Seccion({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-acento">{titulo}</h2>
      {bajada && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tenue">{bajada}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Ficha({ que, detalle }: { que: string; detalle: string }) {
  return (
    <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
      <p className="text-sm font-medium text-tinta">{que}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-tenue">{detalle}</p>
    </div>
  );
}

export default function Guia() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-tenue transition hover:text-acento"
      >
        <ArrowLeft size={14} /> Volver
      </Link>

      <header className="mt-6 border-b border-borde pb-8">
        <div className="flex items-center gap-2.5">
          <BookOpen size={17} className="text-acento" />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-apagado">
            {PRODUCTO} · guía
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-tinta">
          Qué hace, qué no hace, y de dónde sale cada dato
        </h1>
        <p className="mt-3 max-w-2xl text-balance text-lg leading-relaxed text-tenue">
          {PRODUCTO} percibe señales de que un chico puede estar siendo acosado en internet{" "}
          <strong className="text-tinta">sin leer un solo mensaje suyo</strong>. Esta página está
          escrita para quien quiere entenderlo rápido y verificarlo.
        </p>

        {/* 🔴 Faltaba, y lo marcó Edgardo el 17/8: *"no pusiste el ranking
            LATAM donde Argentina figura segunda"*. Estaba en el PDF desde el
            15/8 y no acá. Es el dato que ubica el problema antes de explicar
            nada — sin él, la página arranca hablando de un sistema en el aire. */}
        <div className="mt-6 rounded-lg border border-riesgo/40 bg-riesgoSuave px-5 py-4">
          <p className="text-base font-semibold leading-snug text-tinta">
            Argentina es el segundo país de América Latina con más casos de ciberacoso infantil.
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-tenue">
            Sólo detrás de México, según UNESCO y el CIPDH. Y el estudio nacional midió que el
            37,3% de los casos de grooming no se denunció en ningún lado.
          </p>
        </div>
      </header>

      {/* ── El hallazgo que define el diseño ─────────────────────────────── */}
      <Seccion
        titulo="Por dónde empezar"
        bajada="Antes de las capacidades, el hallazgo que ordena todo el diseño — porque es lo que explica por qué el sistema está hecho así y no como un control parental."
      >
        <div className="rounded-lg border border-riesgo/40 bg-riesgoSuave px-5 py-5">
          <p className="text-sm leading-relaxed text-tinta">
            Los indicadores de grooming están documentados, pero son{" "}
            <strong>conversacionales</strong>: toda la investigación seria detecta leyendo
            mensajes. Un filtro de red ve dominio y hora. Y el estudio nacional ubica el grooming
            en{" "}
            <strong>Facebook (52,8%), Instagram (33,1%) y WhatsApp (30,7%)</strong>: las tres
            permitidas y las tres cifradas. Para un filtro, un pedido de fotos a un chico de 12 y la
            tarea del colegio son el mismo evento.
          </p>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-tinta">
            Ningún control parental por DNS protege del grooming. Ni éste ni ninguno.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-tenue">
            Por eso {PRODUCTO} no confía en una sola fuente: cruza tres. Lo que ve la red, lo que
            observan los adultos, y lo que dicen las estadísticas oficiales sobre cuánto pesa cada
            cosa.
          </p>
        </div>
      </Seccion>

      {/* ── Capacidades ──────────────────────────────────────────────────── */}
      <Seccion
        titulo="Qué hace"
        bajada="Tres entradas, una lectura, dos salidas. Todo lo que sigue se puede ver funcionando en la pantalla principal, sin registrarse."
      >
        <div className="flex flex-col gap-3">
          {/* 🔴 Reescrito el 17/8. Decía «actividad en horarios que para su
              edad son de madrugada», y Edgardo lo frenó: *"habíamos dicho que
              hay muchas razones por las que un chico está despierto a la
              madrugada"*. Enumerarla así, seca y al lado de las otras, la deja
              sonando como si estar despierto de noche fuera en sí mismo un
              indicio — y no lo es. Lo que la hace significar algo es que se
              repita, y eso hay que decirlo en la misma frase o no decirlo. */}
          <Ficha
            que="Mira la actividad de red del chico, no su contenido"
            detalle="Cuánto, a qué hora, hacia qué tipo de sitio, y si aparecieron intentos de saltar el filtro. Nunca el texto. Y ninguno de esos hechos significa nada por separado: un chico despierto de noche puede estar jugando, de vacaciones o durmiendo mal, y el sistema no tiene forma de saber cuál es."
          />
          <Ficha
            que="No alerta por un evento: alerta por persistencia"
            detalle="Un pico aislado es ruido. El sistema exige que el patrón se sostenga varios días antes de abrir la boca — el estudio nacional midió que al 43,5% de las víctimas la acosaron más de una vez, contra un 29,3% una sola."
          />
          <Ficha
            que="Aprende a este chico, no a un chico promedio"
            detalle="Arma un perfil con toda la historia disponible y compara contra su propia conducta previa. Cuanto más tiempo lleva conectado, más ve. Y dos señales —madrugada y evasión del filtro— no se comparan contra nada, así que valen desde el primer día."
          />
          {/* 🔴 **Faltaba, y lo marcó Edgardo el 17/8:** *"el sistema hace
              análisis de datos… y razonamiento basado en datos de psicología,
              patrones de ataque de los depredadores que proporcionan organismos
              específicos, que debemos mencionarlos"*. El modelo estaba
              construido desde el 15/8 (`modus-operandi.ts`) y la guía no lo
              nombraba: es lo que separa mirar la sombra del chico de reconocer
              la secuencia del que ataca. */}
          <Ficha
            que="Mira al agresor, no sólo al chico"
            detalle="El grooming no es un evento: es una secuencia con etapas, descrita por el Sexual Grooming Model. El sistema no diagnostica una etapa —no puede—, pero sabe qué huella dejaría cada una en la red y reconoce la secuencia a mitad de camino."
          />
          <Ficha
            que="Cruza lo que la red no puede ver"
            detalle="Nueve preguntas a los adultos sobre hechos que ellos observan y una red jamás vería. Cada pregunta declara de dónde sale, y ninguna se presenta como indicador validado si no lo es."
          />
          <Ficha
            que="Le escribe a los adultos Y al propio chico"
            detalle="Cuando el patrón se sostiene, el aviso va a los adultos responsables con el porqué y con lo que no se puede saber; y al chico le llega orientación escrita para su edad, por su canal."
          />
          <Ficha
            que="Un asistente que acompaña a los adultos"
            detalle="Explica el informe, ordena las opciones y dice cómo abrir la conversación. Cada respuesta se revisa antes de que la leas: no puede decirte que no es nada, ni que sí, ni estimar qué tan probable es — eso no lo puede saber, y decírtelo sería mentirte con cara de sistema."
          />
          {/* 🔴 **Estaba construido desde el 15/8 y la guía no lo nombraba.**
              Lo marcó Edgardo el 17/8 pidiendo mostrar que la herramienta es
              potente y fundada — y describió exactamente esto, sin saber que
              ya existía: un depredador que se conecta con muchos chicos, y los
              perfiles de esos chicos iguales entre sí.
              🔑 Es lo más difícil de copiar que tiene el producto: no compara
              al chico contra sí mismo, compara un LUGAR contra el resto de las
              casas. Ver `src/lib/observatorio/`. */}
          <Ficha
            que="Cruza lo que pasa en una casa con lo que pasa en las demás"
            detalle="Un acosador no trabaja de a un chico: la literatura lo llama «spray and prey» — contacta a muchos a la vez. Si el mismo lugar nuevo aparece en varias casas la misma semana, eso ya pide explicación. Y no se cuenta cuántos chicos lo vieron, porque entonces lo más peligroso sería siempre lo más popular: se mide cuánto más aparece entre los chicos con alerta que entre todos los demás."
          />
          <Ficha
            que="Y mira si el público de ese lugar es imposible"
            detalle="Un lugar legítimo tiene público diverso: Roblox tiene chicos de 7 a 17, varones y nenas. Un canal armado para captar tiene público angosto — misma edad, mismo género. Por eso el sistema puede señalar un sitio que nadie vio nunca y del que no hay ninguna denuncia previa: no necesita saber qué es, le alcanza con notar que su público no se parece al de ninguna plataforma normal."
          />
          {/* 🔴 **Esto estaba escrito como una carencia y Edgardo lo dio
              vuelta el 17/8:** *"obvio que no tiene casas si esto es un
              concurso; un punto que tenés que destacar es que el sistema se va
              fortaleciendo en la medida que junta datos, necesarios y
              fundamentales para análisis"*.
              🔑 Tenía razón y el encuadre anterior era malo por dos motivos: se
              disculpaba por algo que no es una falla, y escondía una propiedad
              real del diseño. **Que el sistema mejore con el uso no es una
              promesa a futuro: es cómo está construido**, y se puede señalar
              dónde. Lo que NO cambia es la honestidad — los marcadores de
              solidez y el piso de privacidad siguen acá, contados como lo que
              son: rigor, no letra chica. */}
          <div className="rounded-lg border border-acento/40 bg-acentoSuave px-5 py-5">
            <p className="text-sm font-semibold text-tinta">
              Y se fortalece con el uso — por diseño, no como promesa
            </p>
            <p className="mt-2 text-sm leading-relaxed text-tinta">
              AntiGro mejora en <strong>dos ejes a la vez</strong>. Con el tiempo en una casa: el
              perfil se arma con toda la historia disponible, no con una ventana fija, así que cada
              día que pasa el sistema distingue mejor lo raro de lo habitual{" "}
              <em>en ese chico</em>. Y con cada casa nueva: el cruce entre familias se vuelve más
              filoso, porque un lugar que aparece en dos casas es una coincidencia y en seis es un
              patrón.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tinta">
              <strong>Y no arranca desprotegido mientras aprende</strong>, que es la trampa de
              cualquier sistema que necesita datos: las dos señales que no se comparan contra nada
              —los horarios y los intentos de saltar el filtro— funcionan desde el primer día,
              incluso con un chico que ya venía siendo acosado antes del alta.
            </p>
            <p className="mt-3 border-t border-acento/20 pt-3 text-sm leading-relaxed text-tenue">
              Por eso cada hallazgo sale marcado con cuánto se apoya —<em>insuficiente</em>,{" "}
              <em>indicio</em> o <em>consistente</em>—, y por debajo de un piso de chicos el
              sistema directamente no mira el perfil, porque con pocos casos un casillero de
              «nenas de 10» es casi una identidad.{" "}
              <strong className="text-tinta">
                Un observatorio que informa un hallazgo sin decir sobre cuántos casos se apoya es
                peor que no tenerlo: alguien lo va a citar.
              </strong>
            </p>
          </div>

          <Ficha
            que="El chico sabe que existe, desde el minuto cero"
            detalle="El alta incluye una pantalla que guía a los padres sobre qué contarle. Un chico que sabe que hay una red que lo cuida es un aliado; uno que se siente espiado es un adversario."
          />
        </div>
      </Seccion>

      {/* ── 🔴 La sección que sostiene a todas las demás ─────────────────── */}
      <Seccion
        titulo="Lo que NO hace"
        bajada="Es la parte más importante de esta guía. Un sistema que sólo enumera capacidades se lee como un folleto."
      >
        <ul className="flex flex-col gap-3">
          {[
            [
              "Nunca afirma que un chico está siendo acosado. Ni que está a salvo.",
              "Señala, nombra y deriva. Las dos afirmaciones son igual de irresponsables, y la segunda es peor porque tranquiliza.",
            ],
            [
              "No lee el contenido de las conversaciones. Nunca.",
              "Es la línea que separa esto de un espía. De lo que escribe el chico no se guarda una palabra, y el modelo de datos está construido para que no se pueda.",
            ],
            [
              "No ve lo que pasa dentro de WhatsApp, Instagram ni Facebook.",
              "Van cifradas, y ahí es donde el estudio nacional ubica el grooming. El sistema lo dice en cada informe en vez de disimularlo.",
            ],
            /* 🔴 Reescrito el 17/8. Decía «decide el motor con el registro
               fechado, el modelo sólo escribe el texto y un control automático
               lo revisa». Lo volteó Edgardo con una pregunta que no tiene
               vuelta: *"¿qué puede saber el usuario/padres de qué es «modelo» y
               de controles automáticos?"*. Nada. Y la garantía más importante
               del producto no puede estar escrita en un idioma que el que la
               necesita no habla. */
            [
              "La inteligencia artificial no decide nada.",
              "Quién decide es el sistema, mirando qué pasó y en qué días. La inteligencia artificial sólo lo pone en palabras. Y antes de que ese texto le llegue a nadie, se revisa que no diga nada que el sistema no pueda sostener; si no pasa esa revisión, sale un texto escrito de antemano.",
            ],
            /* 🔴 Acá había un ítem sobre el turno escolar y el descanso del
               chico. **Lo sacó Edgardo el 17/8** y el motivo es de producto, no
               de redacción: *"da la idea de que el sistema se dedica a
               establecer si el chico descansa o no… lleva a que los padres
               piensen que esto tiene que ver con el grooming"*.
               🔑 El turno escolar es un dato NUESTRO, que usamos como contexto
               para armar el perfil. No se le explica al padre como si fuera una
               función del producto. */
            [
              "No es prueba judicial.",
              "Es una cronología de qué se vio y en qué días, que puede ordenar una denuncia. La denuncia se hace en la Justicia.",
            ],
          ].map(([que, detalle]) => (
            <li key={que} className="rounded-lg border border-borde bg-fondo px-5 py-4">
              <p className="text-sm font-medium text-tinta">{que}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-tenue">{detalle}</p>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* ── Cómo se instala ──────────────────────────────────────────────── */}
      {/* 🔴 Reescrito el 17/8. Ver `COMO_FUNCIONA` en `config.ts`: el texto
          viejo hablaba de «el aparato», «un servidor de nombres» y «ese
          servidor» sin decir nunca cuál, y Edgardo lo frenó pregunta por
          pregunta. Ahora sale de un solo lugar, y en criollo. */}
      <Seccion titulo="Qué hay que instalar" bajada={COMO_FUNCIONA.noEs}>
        <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
          <p className="text-sm leading-relaxed text-tenue">{COMO_FUNCIONA.laComparacion}</p>
          <p className="mt-3 text-sm leading-relaxed text-tinta">{COMO_FUNCIONA.queCambia}</p>
          <p className="mt-3 text-sm leading-relaxed text-tenue">{COMO_FUNCIONA.elLimite}</p>

          <p className="mt-4 border-t border-borde pt-3 text-sm leading-relaxed text-tenue">
            <strong className="text-tinta">{COMO_FUNCIONA.donde}</strong> Y eso no es una
            preferencia: el router no ve los datos móviles, y ahí vive la señal de madrugada — una
            de las dos que valen desde el primer día. Puesto sólo en el router, el sistema queda
            ciego a esa hora <em>y ni se entera</em>: no recibir nada se lee igual que estar todo
            tranquilo.
          </p>
        </div>
      </Seccion>

      {/* ── Proyecciones ─────────────────────────────────────────────────── */}
      <Seccion
        titulo="Hacia dónde va"
        bajada="Se cuenta como dirección del proyecto, nunca como algo que ya hace. La diferencia importa: lo de arriba se puede probar hoy en pantalla; esto todavía no existe."
      >
        <div className="flex flex-col gap-3">
          <Ficha
            que="Investigación por la vía policial y judicial"
            detalle="Los factores de riesgo mejor documentados no están en la web abierta: se consiguen en esferas policiales y judiciales. El único estudio de factores de riesgo que apareció está armado sobre sentencias."
          />
          {/* 🔴 Reescrito el 17/8. La versión anterior decía que el contexto
              servía «para que el asistente no dé un consejo estúpido», y
              Edgardo la frenó por dos motivos distintos: la palabra, y que
              **vendía corta la herramienta**. Cada tipo de dato tiene una
              función precisa y hay que decir cuál. */}
          <Ficha
            que="Perfil de vulnerabilidad — contexto que orienta, nunca un puntaje"
            detalle="Nivel y tipo de escuela, con quién vive el chico, su turno. Cada dato tiene una función precisa: definir a quién se escala cuando el sistema habla (si los padres viven en casas distintas, la segunda línea es la otra casa); ajustar a quién le habla el asistente, porque el consejo que sirve para una madre no sirve para el abuelo que está criando; y afinar la lectura de los horarios. No mueve ningún puntaje, y eso es deliberado: el estudio del Ministerio documenta comunicación familiar deficiente como factor de riesgo, no la forma de la familia. Puntuar a una familia por su estructura sería inventar una autoridad que ninguna fuente respalda."
          />
          {/* 🔴 Reescrito el 17/8. Edgardo: *"si el informe dice esto, es lo
              mismo que un padre vaya y diga lo que le parece al denunciar; esto
              tiene que ser más fundado"*. Tenía razón: la versión anterior
              describía un acta, no una herramienta. Lo que sigue es lo que el
              sistema **ya calcula** — no hay nada acá que haya que inventar. */}
          <Ficha
            que="Un informe para que el padre pueda denunciar"
            detalle="No una conclusión —el sistema no afirma— sino cuatro cosas que un padre solo no puede llevar: el registro fechado de qué se vio y en qué días; con qué etapa del modelo de grooming encaja esa huella y por qué; qué dicen las estadísticas oficiales sobre ese perfil de chico; y, si el observatorio lo detectó, que ese mismo lugar apareció en otras casas la misma semana. Y al lado, con la misma letra, qué es lo que explícitamente no se puede ver. Eso es lo que separa una denuncia con material de una denuncia con una impresión."
          />
          {/* 🔴 **ACÁ HABÍA UNA FICHA SOBRE BULLYING Y LA SACÓ EDGARDO EL 17/8.**
              Textual: *"metiste bullying y sólo te había hecho una consulta que
              era para entorno"*. Tiene razón y yo tenía la decisión escrita:
              **el PDF de presentación no menciona bullying a propósito**, y esa
              decisión no había cambiado. Una consulta suya para entender el
              terreno no es una línea de producto.
              🔴 **No volver a ponerla** sin que él lo pida: hoy no hay fuente
              que respalde transferir los pesos —salen de estudios de grooming—
              y el bullying pasa en buena parte en la escuela, donde la red no
              ve nada. */}
        </div>
      </Seccion>

      {/* ── 🔴 De dónde sale cada dato ───────────────────────────────────── */}
      <Seccion
        titulo="De dónde salen los datos"
        bajada="Toda cifra que el sistema muestra sale de acá. Las que no tienen fuente, no se afirman."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">
              Estudio nacional sobre acoso sexual a niñas, niños y adolescentes mediante TIC
            </p>
            <p className="mt-1 text-xs text-apagado">
              Ministerio de Justicia y Derechos Humanos de la Nación, Dirección Nacional de
              Política Criminal, 2023
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-acento">
              Lo que el estudio midió
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-tenue">
              <li>
                · Dónde ocurrió el hecho: <strong className="text-tinta">Facebook 52,8%</strong>,
                Instagram 33,1%, WhatsApp 30,7%.
              </li>
              <li>· 66,3% de las víctimas fue de género femenino.</li>
              <li>· 72,3% de las víctimas tenía entre 12 y 14 años. Un 14,5% entre 6 y 11.</li>
              <li>· Al 43,5% la acosaron más de una vez; al 29,3%, una sola.</li>
              <li>· 37,3% de los casos no se denunció en ningún lado.</li>
              <li>· 61,4% de las familias no sabía quién era el agresor.</li>
              <li>
                · 4,4% de los hogares con internet y chicos tuvo una víctima de grooming; en la
                mitad de esos casos, en los doce meses previos a la encuesta.
              </li>
              <li>
                · 57,5% de los hogares con internet tiene controles adultos sobre su uso.{" "}
                <strong className="text-tinta">
                  Y en dos tercios de los hogares donde se usa internet, los adultos conocen poco o
                  nada de lo que hacen ahí los chicos.
                </strong>
              </li>
              <li>
                · 23,1% conoce el nombre con el que se denomina el acoso sexual a chicos en
                internet.
              </li>
            </ul>

            <p className="mt-4 rounded-md border border-borde bg-fondo px-3 py-2 text-xs leading-relaxed text-apagado">
              ⚠ Las cifras sobre las víctimas salen de <strong>23 casos</strong>. El propio estudio
              aclara que con esa cantidad no publica cruces, por no ser estadísticamente
              significativos.
            </p>

            {/* 🔴 21/8. Estas cuatro estaban arriba, como si el estudio las
                hubiera medido. No las midió: las RESUME en su estado del arte,
                que son treinta páginas de estudios ajenos antes de la encuesta
                propia. Verificado contra el PDF oficial, no de memoria. */}
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-apagado">
              Lo que el estudio cita de otros
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-tenue">
              <li>
                · Argentina es el <strong className="text-tinta">segundo país de América Latina</strong>{" "}
                con más casos de ciberacoso infantil, sólo detrás de México. 74,3% del{" "}
                <em>ciberacoso</em> pasa por WhatsApp · 80% de las víctimas son nenas · 90% sufre
                acoso cotidiano durante meses · 60% no se denuncia. ⚠ Todo eso es{" "}
                <strong className="text-tinta">UNESCO y CIPDH, 2021, y mide bullying virtual</strong>
                , no grooming.
              </li>
              <li>
                · 56,4% de los chicos de 9 a 17 habla por internet con gente que no conoce · 35,4%
                recibió un pedido de fotos desnudo o con poca ropa (Grooming Argentina, n=4.276).
              </li>
              <li>
                · 43% de los chicos dijo no hablar sobre los riesgos en Internet con sus padres
                (encuesta en 11 escuelas de una ciudad).
              </li>
              <li>
                · El grueso de las víctimas entre 11 y 15, con un segundo grupo entre 7 y 10 (ESET).
                ⚠ La medición propia del estudio dice otra cosa: 72,3% entre 12 y 14.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">Informe Grooming LATAM</p>
            <p className="mt-1 text-xs text-apagado">
              Red Grooming LATAM, presentado en mayo de 2025 · n≈28.360 encuestas anónimas a chicos
              de 9 a 17 años en 14 países, relevamiento 2024/2025 ·{" "}
              <span className="font-mono">groomingarg.org/informe-grooming-latam</span>
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed text-tenue">
              <li>· La franja más vulnerable es de 9 a 13 años.</li>
              <li>· 33,3% recibió una propuesta de «ser novio o novia» dentro de un juego.</li>
            </ul>
          </div>

          {/* 🔴 La fuente del cruce entre casas. Sin esto, «los acosadores
              contactan a muchos chicos a la vez» sería una corazonada nuestra
              — y es sobre esa frase que se apoya el observatorio entero. */}
          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">
              Por qué un mismo lugar aparece en varias casas a la vez
            </p>
            <p className="mt-1 text-xs text-apagado">
              Revisión de estrategias de grooming pre y post internet — Child Abuse &amp; Neglect,
              noviembre de 2021 · PubMed 34801848
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              La revisión describe lo que llama <em>«spray and prey»</em>: la tecnología le permite
              al acosador chatear <strong className="text-tinta">simultáneamente con cualquier
              cantidad de chicos</strong>, en cualquier lugar y momento. De ahí sale una
              consecuencia que el sistema aprovecha: si un mismo acosador toca a muchos chicos a la
              vez, el mismo lugar aparece en varios chicos a la vez.{" "}
              <strong className="text-tinta">
                Eso no necesita escala para significar algo: necesita simultaneidad, y la
                simultaneidad la pone el atacante.
              </strong>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              ⚠ Y una distinción que el sistema respeta: que las víctimas se concentran en un
              perfil está en las dos fuentes del proyecto. Que <em>cada</em> acosador persiga un
              perfil consistente es una inferencia razonable que{" "}
              <strong className="text-tinta">no está verificada en fuente, y no se afirma</strong>.
              El detector no depende de eso — mide contra la diversidad esperable de una
              plataforma, sea cual sea el motivo de la concentración.
            </p>
          </div>

          {/* 🔴 Este bloque faltaba y es el que sostiene «mira al agresor». Sin
              él, el razonamiento sobre las etapas parecería nuestro. */}
          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">
              Cómo ataca un agresor — el modelo de las cinco etapas
            </p>
            <p className="mt-1 text-xs text-apagado">
              Sexual Grooming Model (SGM) — Winters &amp; Jeglic, 2017; ampliado con una quinta
              etapa por Winters y col., 2020
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              Es un modelo con <strong className="text-tinta">validez de contenido establecida
              por un panel de expertos</strong>, que describe 77 conductas agrupadas en cinco
              etapas: selección de la víctima · obtener acceso y aislarla · desarrollo de la
              confianza · desensibilización · mantenimiento posterior. Sobre él se construyó la{" "}
              <em>Sexual Grooming Scale – Victim Version</em>, puesta a prueba con 115 víctimas
              adultas.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              AntiGro no lo usa para diagnosticar una etapa —para eso habría que leer las
              conversaciones, y no se leen—. Lo usa al revés:{" "}
              <strong className="text-tinta">
                para saber qué huella dejaría cada etapa en la red
              </strong>{" "}
              y poder decir «lo que se ve encaja con esta forma», que es distinto de «esto está
              pasando».
            </p>
          </div>

          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">
              Qué le preguntamos a los adultos, y por qué esa pregunta
            </p>
            <p className="mt-1 text-xs text-apagado">
              Ministerio Público de la Provincia de Buenos Aires — Procuración General de la SCBA
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              Recomienda a los adultos observar cambios de humor y de horarios de conexión. Es una
              recomendación de un organismo oficial,{" "}
              <strong className="text-tinta">sin una cifra detrás</strong>, y el sistema la trata
              como tal: vale más que nuestra intuición y menos que un porcentaje. Cada pregunta del
              cuestionario declara si se apoya en un estudio, en la recomendación de un organismo,
              o si es simplemente un hecho observable que le pedimos al adulto que mire{" "}
              <strong className="text-tinta">sin afirmar que ese hecho signifique grooming</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">
              Por qué la madrugada se mide distinto según la edad
            </p>
            <p className="mt-1 text-xs text-apagado">
              Asociación Española de Pediatría (<span className="font-mono">aeped.es/enfamilia</span>
              ) y Sociedad Española de Medicina de la Adolescencia (
              <span className="font-mono">adolescenciasema.org</span>)
            </p>
            <p className="mt-3 text-sm leading-relaxed text-tenue">
              En la adolescencia hay un retraso biológico del inicio de la secreción nocturna de
              melatonina: el punto medio del sueño se corre a lo largo de la segunda década de la
              vida. Por eso, a las 2 de la mañana, una nena de 9 y un pibe de 16 no son lo mismo —
              y el sistema{" "}
              <strong className="text-tinta">corre la hora en vez de bajar el peso</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-borde bg-superficie px-5 py-4">
            <p className="text-sm font-semibold text-tinta">Marco legal argentino</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-tenue">
              <li>· {MARCO_LEGAL.ley26904}</li>
              <li>· {MARCO_LEGAL.ley27590}</li>
            </ul>
          </div>

          {/* 🔴 Los pesos son NUESTROS y eso se dice. El estudio no publica
              coeficientes de riesgo, y decir que sí sería inventar una autoridad. */}
          <div className="rounded-lg border border-atencion/40 bg-atencionSuave px-5 py-4">
            <p className="text-sm font-semibold text-tinta">
              Y una distinción que conviene no saltear
            </p>
            <p className="mt-2 text-sm leading-relaxed text-tinta">
              Las cifras de arriba son de los estudios. Los <strong>números concretos</strong> con
              los que el motor pondera cada señal —cuánto pesa la madrugada, cuántos días tiene que
              sostenerse un patrón— <strong>los elegimos nosotros</strong>, informados por esas
              cifras. Ningún estudio publica coeficientes de riesgo, y presentarlos como si
              vinieran de ahí sería inventar una autoridad que no existe.
            </p>
          </div>
        </div>
      </Seccion>

      {/* ── A dónde recurrir ─────────────────────────────────────────────── */}
      <Seccion
        titulo="Cuando la respuesta correcta no es un sistema"
        bajada="Está escrito en el producto y no en la letra chica: cuando lo que hace falta es un adulto o un organismo, el sistema lo dice."
      >
        <div className="flex flex-col gap-3">
          <Ficha
            que={`${RECURSOS.linea137.nombre} — ${RECURSOS.linea137.telefono}`}
            detalle={`${RECURSOS.linea137.detalle}. WhatsApp ${RECURSOS.linea137.whatsapp}.`}
          />
          <Ficha
            que={RECURSOS.gapp.nombre}
            detalle={`${RECURSOS.gapp.detalle} — ${RECURSOS.gapp.url}`}
          />
        </div>
      </Seccion>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-borde pt-8">
        <Link
          href="/"
          className="rounded-md bg-degradado px-5 py-2.5 text-sm font-semibold text-fondo transition hover:opacity-90"
        >
          Ver el sistema funcionando
        </Link>
      </div>
    </main>
  );
}
