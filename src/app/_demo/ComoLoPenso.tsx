"use client";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VER CÓMO LO PENSÓ — la cuenta de la corrida que se está mirando
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **No es una explicación del motor: es la liquidación de ESTA lectura.**
 *  Un texto que cuente cómo funciona el sistema se escribe una vez y envejece
 *  solo. Esto lee los mismos umbrales que usó el motor hace medio segundo, así
 *  que si alguien mueve una perilla en `evaluar.ts`, acá cambia el número.
 *
 *  🔑 **Para qué está.** El que mira la consola ve «El patrón se sostiene» en
 *  rojo con un 80% y un gráfico subiendo, y no tiene forma de saber si eso salió
 *  de una cuenta o de un `if` escrito para la demo. Acá está la cuenta: cuántos
 *  días sostenidos lleva contra los que le exige, qué umbral pasó y cuál no, y
 *  **cuál de las cinco reglas disparó ese estado**.
 *
 *  📌 Va cerrado. Un `<details>` cerrado cuesta ~44 px, y la pantalla que se
 *  ganó el 20/9 no se devuelve para poner una tabla que casi nadie abre. El que
 *  la abre —un jurado, un padre desconfiado, un técnico— es exactamente el que
 *  no se conforma con que se lo digan.
 *
 *  ⚠ **Registro: tercera persona, sin voseo.** No por España —el barrido del
 *  idioma quedó para después del 24, y el producto es argentino— sino porque es
 *  texto nuevo y no tiene sentido agregarle trabajo a ese barrido. Una tabla
 *  técnica no le habla a nadie de «vos» ni de «tú»: habla del sistema.
 */

import {
  APORTE_MAXIMO_ADULTOS,
  CARGA_MINIMA_DIA,
  EVASIONES_PARA_HABLAR,
  NOMBRE_DE_REGLA,
  PUNTAJE_PARA_ATENCION,
  PUNTAJE_PARA_HABLAR,
  type Lectura,
} from "@/lib/motor/evaluar";
import {
  CLASE_DE_SENAL,
  MEDIA_VENTANA_DIAS,
  PESO_POR_TIPO,
  VENTANA_DIAS,
  factorEdad,
  factorGenero,
  horaDeReferencia,
} from "@/lib/motor/pesos";
import { NOMBRE_DE_SENAL, TIPOS_DE_SENAL } from "@/lib/senales/tipos";
import {
  TOTAL_DOMINIOS_DE_EVASION,
  TOTAL_DOMINIOS_DE_INFRAESTRUCTURA,
  TOTAL_DOMINIOS_DE_USO,
  TOTAL_SERVICIOS,
} from "@/lib/senales/servicios";
import type { Genero } from "@/lib/datos/tipos";

/** Dos decimales con coma, que es como se escriben los números acá. */
const num = (n: number, dec = 2) =>
  n.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function ComoLoPenso({
  lectura,
  edad,
  genero,
}: {
  lectura: Lectura | null;
  edad: number;
  genero: string;
}) {
  if (!lectura) return null;

  /* ── Las mismas cuentas que hizo el motor, con sus mismos números ──────
     📌 Se recalculan acá en vez de viajar en la lectura porque son
     intermedias: el motor devuelve el resultado, y mostrar el paso de por
     medio no justifica engordar su contrato. Lo que NO se recalcula nunca
     son los umbrales ni la regla que decidió — eso viene del motor. */
  const recientes = lectura.dias.slice(-MEDIA_VENTANA_DIAS);
  const mediaReciente =
    recientes.length === 0 ? 0 : recientes.reduce((a, d) => a + d.carga, 0) / recientes.length;

  const fEdad = factorEdad(edad);
  const fGenero = factorGenero(genero as Genero);
  const aporteAdultos = lectura.adultos.puntaje * APORTE_MAXIMO_ADULTOS;

  /* Qué tipos de señal aparecieron en los días que contaron. */
  const tiposPresentes = new Set(
    lectura.dias.filter((d) => d.carga >= CARGA_MINIMA_DIA).flatMap((d) => d.tipos),
  );

  const horaRef = horaDeReferencia(edad);
  const horaRefTexto = `${String(horaRef % 24).padStart(2, "0")}:00`;

  /* 📌 `scroll-mt-14`: la barra «datos de ejemplo» es `sticky` arriba del marco,
     así que al llegar acá con el tabulador el navegador deja el encabezado JUSTO
     DEBAJO de esa barra y no se lee. Se vio en pantalla, no en el código. */
  return (
    <details className="group mt-8 scroll-mt-14 rounded-lg border border-acento/40 bg-acentoSuave/40">
      {/* 🔴 **Se ve como algo que se toca, y costó una corrección de Edgardo (21/9):**
          *"no puedo ver esa sección"*. Estaba gris entre dos bloques grises, el
          título se partía en dos renglones en el teléfono, y a 5,4 pantallas de
          scroll. **Si él no lo encontró, el jurado tampoco** — el mismo patrón
          que ya había pasado con el asistente a 1.865 px y con «Ver el mensaje».
          📌 El arreglo NO agranda el bloque, sólo lo hace visible: color de
          acento en vez de gris, el título en una sola línea, y el subtítulo se
          esconde en el teléfono, que es donde empujaba el renglón. */}
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 text-sm text-acento transition hover:bg-acentoSuave [&::-webkit-details-marker]:hidden">
        <span
          className="shrink-0 text-[10px] transition-transform group-open:rotate-90"
          aria-hidden
        >
          ▶
        </span>
        <span className="whitespace-nowrap font-semibold">Ver cómo lo pensó</span>
        <span className="hidden text-xs text-apagado sm:inline">la cuenta de esta lectura</span>
      </summary>

      <div className="space-y-6 border-t border-borde px-4 py-5">
        {/* ── 1. LA REGLA QUE DECIDIÓ ──────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-acento">
            Qué regla decidió
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-tinta">
            {NOMBRE_DE_REGLA[lectura.reglaQueDecidio]}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-apagado">{EXPLICA[lectura.reglaQueDecidio]}</p>
        </section>

        {/* ── 2. LA CUENTA ─────────────────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-acento">
            La cuenta
          </h3>

          <div className="mt-2.5 divide-y divide-borde/60 border-y border-borde/60">
            <Fila
              que="Lo que vio la red"
              valor={num(lectura.puntajeRed)}
              contra={`media de los últimos ${MEDIA_VENTANA_DIAS} días (${num(
                mediaReciente,
              )}) × edad (${num(fEdad)}) × género (${num(fGenero)})`}
            />
            <Fila
              que="Lo que marcaron los adultos"
              valor={num(aporteAdultos)}
              contra={
                lectura.adultos.respondidas === 0
                  ? "nadie contestó el cuestionario: no suma, y tampoco resta"
                  : `${num(lectura.adultos.puntaje)} de ${
                      lectura.adultos.respondidas
                    } respuestas, topado en ${num(APORTE_MAXIMO_ADULTOS)}`
              }
            />
            <Fila
              que="Las dos juntas"
              valor={num(lectura.puntaje)}
              contra={`1 − (1 − ${num(lectura.puntajeRed)}) × (1 − ${num(
                aporteAdultos,
              )}) — se combinan como probabilidades, no promediando: una entrada floja no baja a la otra`}
              cumple={lectura.puntaje >= PUNTAJE_PARA_HABLAR}
              umbral={`${num(PUNTAJE_PARA_HABLAR)} para hablar · ${num(
                PUNTAJE_PARA_ATENCION,
              )} para mirar`}
            />
            <Fila
              que="Días sostenidos"
              valor={String(lectura.diasSostenidos)}
              destacado
              contra={
                lectura.diasExigidos < 8
                  ? "bajó de 8 a " +
                    lectura.diasExigidos +
                    ": los adultos están marcando lo mismo que ve la red, y dos miradas independientes que coinciden necesitan menos evidencia de cada una"
                  : "la racha tolera un día de silencio, dos la cortan"
              }
              cumple={lectura.diasSostenidos >= lectura.diasExigidos}
              umbral={`${lectura.diasExigidos} exigidos`}
            />
            <Fila
              que="Días fuera de lo habitual"
              valor={`${lectura.diasConSenal} de ${VENTANA_DIAS}`}
              contra={`un día cuenta desde una carga de ${num(
                CARGA_MINIMA_DIA,
              )}; por debajo es vida normal`}
            />
            <Fila
              que="Intentos de saltar el filtro"
              valor={String(lectura.evasionesRecientes)}
              contra="camino propio: con dos, el sistema habla sin esperar racha ni umbral"
              cumple={lectura.evasionesRecientes >= EVASIONES_PARA_HABLAR}
              umbral={`${EVASIONES_PARA_HABLAR} en la última semana`}
            />
            <Fila
              que="Tendencia"
              valor={(lectura.tendencia >= 0 ? "+" : "") + num(lectura.tendencia)}
              contra="la última semana contra la anterior. Positivo: se está profundizando"
            />
            <Fila
              que="Alcance de la lectura"
              valor={pct(lectura.alcance.valor)}
              contra={`historia ${pct(lectura.alcance.porHistoria)} · regularidad ${pct(
                lectura.alcance.porRegularidad,
              )}. Multiplica sólo a las señales relativas — las absolutas no dependen de esto`}
            />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-apagado">
            El sistema lleva {lectura.perfil.diasObservados}{" "}
            {lectura.perfil.diasObservados === 1 ? "día" : "días"} observando a este chico. Nivel
            habitual {num(lectura.perfil.nivelHabitual)} · variabilidad{" "}
            {num(lectura.perfil.variabilidad)}.
          </p>
        </section>

        {/* ── 3. CUÁNTO PESA CADA SEÑAL ────────────────────────────────── */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-acento">
            Cuánto pesa cada señal
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-apagado">
            Las marcadas son las que aparecieron en esta corrida. Los pesos son decisión de
            producto, no una cifra de ningún estudio: lo que los ordena es que la evasión del filtro
            es la señal más fuerte que puede ver una red, y el volumen la que más se confunde con la
            vida normal de un chico.
          </p>

          <ul className="mt-3 space-y-1.5">
            {TIPOS_DE_SENAL.map((t) => {
              const presente = tiposPresentes.has(t);
              const absoluta = CLASE_DE_SENAL[t] === "absoluta";
              return (
                <li
                  key={t}
                  className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 rounded-md border px-3 py-2 text-xs ${
                    presente ? "border-acento/40 bg-acentoSuave" : "border-borde/60"
                  }`}
                >
                  <span className={`font-medium ${presente ? "text-tinta" : "text-tenue"}`}>
                    {NOMBRE_DE_SENAL[t]}
                  </span>
                  <span className="font-semibold tabular-nums text-acento">
                    {num(PESO_POR_TIPO[t])}
                  </span>
                  <span className="text-apagado">
                    {absoluta ? "absoluta" : "relativa"} ·{" "}
                    {t === "madrugada"
                      ? `se compara contra la edad: a los ${edad} años la referencia son las ${horaRefTexto}`
                      : absoluta
                        ? "es un acto deliberado, no hay historia que lo relativice"
                        : `se compara contra la conducta previa del propio chico, así que hoy pesa ${pct(
                            lectura.alcance.valor,
                          )}`}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-apagado">
            A eso se le aplica la edad ({edad} años → {num(fEdad)}) y el género ({genero} →{" "}
            {num(fGenero)}). Los dos rangos son angostos a propósito: el dato dice dónde se
            concentran los casos, no dónde dejan de existir, y un factor agresivo dejaría a los
            chicos de 16 y 17 —y a los varones, un tercio de las víctimas— por debajo del umbral.
          </p>
        </section>

        {/* ── 4. DE DÓNDE SALEN LOS DATOS ──────────────────────────────── */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-acento">
            De dónde salen los datos
          </h3>

          <dl className="mt-2.5 space-y-3 text-xs leading-relaxed">
            <div>
              <dt className="font-medium text-tinta">
                Qué lugar es cada dominio — {TOTAL_SERVICIOS} servicios,{" "}
                {TOTAL_DOMINIOS_DE_USO} dominios
              </dt>
              <dd className="mt-0.5 text-apagado">
                Catálogo de <span className="font-mono text-[11px]">nextdns/services</span>,
                licencia MIT. Otros {TOTAL_DOMINIOS_DE_INFRAESTRUCTURA} dominios son CDN y analítica
                del mismo servicio: se reconocen para <strong className="text-tenue">no</strong>{" "}
                contarlos como lugar. Reconocer el cable no es reconocer el edificio, y si contaran,
                bajarse una textura de un juego dispararía el cruce.
              </dd>
            </div>

            <div>
              <dt className="font-medium text-tinta">
                Si por ahí puede escribirle un desconocido — criterio propio
              </dt>
              <dd className="mt-0.5 text-apagado">
                Los dominios se importan; la clasificación no. Cada lugar se marca por una sola
                propiedad: si alguien puede empezar una conversación sin que el chico le entregue
                nada. Eso separa el lugar donde empieza el contacto del lugar a donde se lo lleva, y
                es lo que hace observable la secuencia. Una lista de plataformas peligrosas no se
                puede importar de ningún país —el ranking cambia en cada uno—; la propiedad vale en
                todos.
              </dd>
            </div>

            <div>
              <dt className="font-medium text-tinta">
                Intentos de saltar el filtro — {TOTAL_DOMINIOS_DE_EVASION} dominios
              </dt>
              <dd className="mt-0.5 text-apagado">
                VPN, proxies y DNS alternativos. El DNS del propio sistema no está en la lista y no
                puede estar: un chico consultándolo es el sistema funcionando, no alguien
                esquivándolo.
              </dd>
            </div>

            <div>
              <dt className="font-medium text-tinta">Con qué se calibraron los pesos</dt>
              <dd className="mt-0.5 text-apagado">
                Estudio nacional sobre acoso sexual a NNyA mediante TIC (Ministerio de Justicia y
                DDHH, Argentina, 2023) · Informe Grooming LATAM (2025, ~28.360 encuestas en 14
                países) · ESET, citado en el estado del arte de ese estudio · NSPCC (Reino Unido,
                2023-24) para las plataformas · Asociación Española de Pediatría y Sociedad Española
                de Medicina de la Adolescencia para el corrimiento de fase del sueño, que es lo que
                mueve la hora de referencia según la edad.
              </dd>
            </div>

            <div>
              <dt className="font-medium text-tinta">
                Lo que no existe, y por eso el sistema no lo usa
              </dt>
              <dd className="mt-0.5 text-apagado">
                No hay listas públicas de dominios de grooming ni de material de abuso, y no es una
                falta de la industria: una lista pública de sitios de captación sería un directorio
                para el agresor. Ese material se maneja por canales cerrados y por huella de
                archivo, nunca por dominio. Es la razón de fondo por la que este sistema no busca
                sitios malos: busca un patrón de conducta que se sostiene.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </details>
  );
}

/** Qué hizo cada regla, en una línea. Va debajo del nombre. */
const EXPLICA: Record<Lectura["reglaQueDecidio"], string> = {
  evasion_repetida: `Hubo ${EVASIONES_PARA_HABLAR} o más intentos de saltar el filtro en la última semana. Es la única señal que habla sola: no espera racha ni umbral, porque esquivar un control es un acto deliberado y no se explica por la vida normal de un chico.`,
  racha_y_umbral:
    "Las dos condiciones a la vez: el patrón se sostuvo los días que hacían falta y el puntaje pasó el umbral. Ninguna de las dos alcanza sola — es la regla de persistencia, y es lo que separa una semana rara de algo que viene pasando.",
  cambio_sin_racha:
    "Hubo días distintos y el puntaje pasó el umbral bajo, pero el patrón no se sostuvo. Este estado no le escribe a nadie: es lo que el sistema está mirando, no lo que dice.",
  solo_los_adultos:
    "La red no vio nada fuera de lo habitual. Lo que habla es el cuestionario: lo que cuenta un adulto no necesita que una red lo confirme para merecer una conversación. Pero tampoco sube a patrón sostenido — eso lo tiene que sostener el registro, no una impresión.",
  sin_novedad: `Ninguna regla se activó. No dice que el chico esté a salvo: dice que en estos ${VENTANA_DIAS} días no apareció nada que se apartara de lo habitual en él, con las señales que la red alcanza a ver.`,
};

/** Una línea de la liquidación. `umbral` sólo va donde hay algo que cumplir. */
function Fila({
  que,
  valor,
  contra,
  umbral,
  cumple,
  destacado,
}: {
  que: string;
  valor: string;
  contra: string;
  umbral?: string;
  cumple?: boolean;
  destacado?: boolean;
}) {
  return (
    <div className="py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={`text-xs ${destacado ? "font-medium text-tinta" : "text-tenue"}`}>
          {que}
        </span>
        <span
          className={`font-semibold tabular-nums ${destacado ? "text-sm text-acento" : "text-xs text-tinta"}`}
        >
          {valor}
        </span>
        {umbral && (
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              cumple ? "bg-riesgoSuave text-riesgo" : "bg-superficie text-apagado"
            }`}
          >
            {cumple ? "✓" : "—"} {umbral}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-apagado">{contra}</p>
    </div>
  );
}
