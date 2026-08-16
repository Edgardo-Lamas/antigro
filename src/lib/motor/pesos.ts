/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PONDERACIÓN — cuánto pesa cada cosa
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  ⚠ En este dominio Edgardo NO es la fuente. Todo dato se cita o no se afirma.
 *
 *  Distinguir dos cosas, porque no son lo mismo y mezclarlas sería mentir:
 *
 *  1. **Lo que dice el estudio.** Cifras del Estudio nacional sobre acoso
 *     sexual a NNyA mediante TIC (Ministerio de Justicia y DDHH de la Nación,
 *     Dirección Nacional de Política Criminal, 2023).
 *
 *  2. **Las decisiones de producto.** Los números concretos de esta tabla los
 *     elegimos nosotros, informados por esas cifras. El estudio no publica
 *     coeficientes de riesgo, y decir que sí sería inventar una autoridad.
 */

import type { TipoDeSenal } from "@/lib/senales/tipos";
import type { Genero } from "@/lib/datos/tipos";

/* ── Peso por tipo de señal ──────────────────────────────────────────────── */

/**
 * 📌 Decisión de producto, no cifra del estudio.
 *
 * El orden sale del `CLAUDE.md`: la evasión del filtro es la señal más fuerte
 * que puede ver una red, y es la que hoy no mira nadie. El volumen es la más
 * débil porque es la que más se confunde con la vida normal de un chico.
 */
export const PESO_POR_TIPO: Record<TipoDeSenal, number> = {
  volumen: 0.55,
  madrugada: 0.8,
  plataforma_nueva: 0.85,
  evasion: 1,
};

/* ── Factor por edad ─────────────────────────────────────────────────────── */

/**
 * 📊 **Dos fuentes, y no dicen exactamente lo mismo. Por eso hay cuatro bandas
 * y no dos** (corregido el 15/8/2026):
 *
 * 1. **Estudio nacional (Ministerio de Justicia, 2023):** el grueso de las
 *    víctimas está entre los 11 y los 15, con un segundo grupo importante
 *    entre los 7 y los 10.
 * 2. **Informe Grooming LATAM** (Red Grooming LATAM, presentado en mayo de
 *    2025; n≈28.360 encuestas anónimas a NNyA de 9 a 17 en 14 países,
 *    relevamiento 2024/2025): la franja **más vulnerable es de 9 a 13**.
 *    https://groomingarg.org/informe-grooming-latam
 *
 * 🔴 **El error que esto corrige:** antes los de 9 y 10 caían en la banda de
 * 0,94 y quedaban por debajo de los de 11 a 15, cuando la fuente más grande y
 * más nueva de las dos los pone justo en el centro del riesgo.
 *
 * El criterio es simple y se puede defender delante de un padre: **pesa 1 donde
 * las dos fuentes coinciden** (11 a 13), un escalón menos donde lo nombra una
 * sola, y el piso donde no lo nombra ninguna.
 *
 * ⚠ El rango sigue siendo angosto a propósito (0,88 a 1). Un factor agresivo
 * dejaría a los de 16 y 17 por debajo del umbral, y eso no es lo que dice el
 * dato: dice dónde se concentran los casos, no dónde dejan de existir.
 */
export function factorEdad(edad: number): number {
  // Las dos fuentes coinciden: 11-13 cae dentro de "11 a 15" y de "9 a 13".
  if (edad >= 11 && edad <= 13) return 1;
  // Sólo Grooming LATAM los pone en la franja más vulnerable.
  if (edad >= 9 && edad <= 10) return 0.97;
  // Sólo el estudio del Ministerio los pone en el grueso de los casos.
  if (edad >= 14 && edad <= 15) return 0.97;
  // "Segundo grupo importante" del Ministerio (7 a 10): acá quedan 7 y 8.
  if (edad >= 7 && edad <= 8) return 0.94;
  return 0.88;
}

/**
 * 🔴 **Medido el 15/8/2026, y hay que saberlo antes de tocar esto de nuevo:**
 * la edad mueve el PUNTAJE pero casi nunca mueve el DÍA en que el sistema
 * habla. Barrido de las 24 combinaciones de escenario × género × cuestionario,
 * con las edades de 7 a 17: **el día cambió en 1 sola** (un varón de 16 o 17 en
 * el escenario persistente habla el 18 en vez del 17).
 *
 * El motivo no es un error: el puntaje sube ~0,06 por día cerca del umbral, y
 * todo el rango de edad vale ~0,12. El salto diario se come la diferencia.
 *
 * ⚠ **Por eso, si algún día hace falta que la edad de verdad adelante el
 * aviso, el lugar NO es este multiplicador: es `diasExigidos` en `evaluar.ts`**,
 * que es la palanca que ya usa el cuestionario de los adultos para adelantar
 * tres días. Subir el rango de este factor sólo empujaría a los de 16 y 17 por
 * debajo del umbral, que es exactamente lo que el guardarraíl quiere evitar.
 */

/* ── La madrugada, referenciada por la edad ──────────────────────────────── */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔴 **A las 2 de la mañana, una nena de 9 y un pibe de 16 NO son lo mismo.**
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Lo marcó Edgardo el 15/8/2026: *"si el chico comienza a tener hábitos
 * nocturnos propios de su crecimiento… si tiene 13 y pasaron dos usando el
 * sistema, a los 15 es esperable el cambio"*. Hasta acá la madrugada pesaba
 * 0,80 fijo para todos, y el sistema no sabía la edad del que estaba despierto.
 *
 * 📊 **Y no es sólo sentido común: tiene nombre y respaldo clínico.** En la
 * adolescencia hay un **retraso biológico del inicio de la secreción nocturna
 * de melatonina**, así que el punto medio del sueño se corre a lo largo de la
 * segunda década de la vida — el adolescente sintetiza melatonina más tarde que
 * un chico y que un adulto, y le cuesta más dormirse. Es el sustrato del
 * llamado síndrome de retraso de fase, el trastorno del ritmo circadiano más
 * frecuente en adolescentes, definido como un corrimiento de **más de dos
 * horas** respecto de los horarios convencionales.
 * Fuentes: Asociación Española de Pediatría (`aeped.es/enfamilia`) y Sociedad
 * Española de Medicina de la Adolescencia (`adolescenciasema.org`).
 *
 * 🔑 **Por eso no se atenúa el peso: se corre la hora de referencia.** Amortiguar
 * el peso diría "en los grandes la madrugada importa menos", que es falso.
 * Correr la hora dice lo que de verdad pasa: **en los grandes la madrugada
 * empieza más tarde.** Un chico de 16 a las 3 de la mañana, todas las noches,
 * sigue siendo una señal — sólo que a las 23 todavía no lo es.
 *
 * ⚠ La madrugada **sigue siendo absoluta**: no se compara contra la historia del
 * chico, se compara contra su EDAD. Ahí está el punto que hace que funcione
 * desde el día uno incluso con un chico ya acosado, que es lo que el perfil no
 * puede resolver.
 */

/**
 * A partir de qué hora estar conectado ya no se explica por la edad.
 * 📌 Los cortes son decisión de producto, informados por el corrimiento de fase
 * de ~2 h documentado arriba. Devuelve la hora en formato 24 h.
 */
export function horaDeReferencia(edad: number): number {
  if (edad <= 10) return 22;
  if (edad <= 13) return 23;
  if (edad <= 15) return 24;
  return 25; // 01:00 del día siguiente
}

/**
 * Cuánto pesa una conexión de madrugada **para un chico de esta edad, a esta
 * hora**. Multiplica al peso de la señal.
 *
 * 🔴 **Nunca devuelve cero, y el piso es alto a propósito** (`PISO_MADRUGADA`).
 * Bajarlo mucho dejaría a los de 16 y 17 sin la única señal absoluta que no es
 * la evasión, y esos son justamente los que menos denuncian. Esto atrasa el
 * aviso en un chico grande; **no lo apaga.**
 */
const PISO_MADRUGADA = 0.55;
/** A cuántas horas pasadas la referencia el peso llega al máximo. */
const HORAS_AL_MAXIMO = 4;

export function factorMadrugada(edad: number, hora: number): number {
  // La madrugada cruza la medianoche: 01:00 son las 25 del día anterior.
  const horaCorrida = hora <= 12 ? hora + 24 : hora;
  const desvio = horaCorrida - horaDeReferencia(edad);
  if (desvio <= 0) return PISO_MADRUGADA;
  return Math.min(1, PISO_MADRUGADA + (desvio / HORAS_AL_MAXIMO) * (1 - PISO_MADRUGADA));
}

/* ── Factor por género ───────────────────────────────────────────────────── */

/**
 * 📊 Sostenido en el estudio: el 80% de las víctimas de acoso virtual infantil
 * son nenas.
 *
 * 🔴 Guardarraíl. El rango es todavía más angosto (0,94 a 1) y por una razón
 * que no es de cortesía: si el factor bajara de verdad para los varones, el
 * sistema los detectaría más tarde. El 20% restante no es ruido — son chicos
 * reales, y son los que menos denuncian.
 *
 * 📌 Lo que sí cambia de verdad por género es **qué tipo de riesgo se enfatiza
 * en el mensaje**, no cuánto tarda el sistema en hablar.
 */
export function factorGenero(genero: Genero): number {
  return genero === "nena" ? 1 : 0.94;
}

/* ── Dos vías, en paralelo ───────────────────────────────────────────────── */

/**
 * 🔑 **El punto ciego que esto resuelve** (lo encontró Edgardo el 14/8):
 * el que contrata este sistema muchas veces lo contrata porque YA sospecha algo.
 * Si el chico ya está dentro del proceso cuando arranca el aprendizaje, un
 * sistema que sólo detecta CAMBIOS aprende el abuso como si fuera lo normal de
 * esa casa, y no alerta nunca.
 *
 * Por eso hay dos clases de señal, y corren en paralelo:
 *
 * - `absoluta` — **no se compara contra la historia de ese chico.** Intentar
 *   saltar el filtro es un acto deliberado, sea el día 2 o el 200. La madrugada
 *   se compara contra la EDAD (`factorMadrugada`), que es un dato que el
 *   sistema tiene desde el alta y no necesita aprender.
 *   **Funcionan desde el minuto uno.**
 *
 *   🔴 **Acá decía "es desordenado en sí mismo: al otro día no descansó para la
 *   escuela", y estaba mal.** Lo volteó Edgardo el 16/8: el chico puede estar de
 *   vacaciones, o ir al turno tarde y dormir hasta el mediodía — en los dos
 *   casos descansó bien. **El sistema no conoce los horarios de esa casa**, así
 *   que el descanso no lo puede afirmar. Y no hacía falta: lo que sostiene a
 *   estas dos señales no es el daño que causan, es que **no dependen de conocer
 *   al chico**, que es exactamente lo que falta cuando el abuso empezó antes
 *   que el sistema.
 * - `relativa` — "saltó el volumen", "apareció una plataforma nueva". Sólo
 *   significan algo contra la conducta previa del propio chico, así que **pesan
 *   por cuánto alcanzó a desplegarse la lectura** (`alcanceDeLaLectura`, en
 *   `perfil.ts`). Ya no se apagan y se prenden: se atenúan.
 */
export type ClaseDeSenal = "absoluta" | "relativa";

export const CLASE_DE_SENAL: Record<TipoDeSenal, ClaseDeSenal> = {
  // Se compara contra la EDAD, no contra la historia de este chico.
  madrugada: "absoluta",
  // Acto deliberado de esquivar el control. No hay historia que lo relativice.
  evasion: "absoluta",
  // "Saltó" sólo tiene sentido contra el volumen habitual de ese chico.
  volumen: "relativa",
  // "Nueva" está definido contra lo que aparecía antes. Sin antes, no hay nueva.
  plataforma_nueva: "relativa",
};

/* ── Cuánto conoce el sistema al chico ───────────────────────────────────── */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔴 **Acá había un `APRENDIZAJE_DIAS = 14`. Lo sacamos el 15/8/2026 y la razón
 *  la puso Edgardo. Vale la pena que quede escrita entera, porque es de las
 *  decisiones que definen el producto.**
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ese número era un **interruptor**: antes del día 14 las señales relativas
 * valían cero, y a partir del 14 valían el 100%. Un escalón, de golpe.
 *
 * Su objeción, textual: *"cada chico, cada situación, es diferente, no hay
 * manera de establecer una conducta 'x' en 5/10/14/30 días… y son adolescentes,
 * están permanentemente cambiando"*. Y después, lo que ordenó todo el diseño:
 * *"el sistema protege al chico desde el día uno, pero esa protección se va
 * desplegando con el tiempo; no es un soldado listo para disparar"*.
 *
 * Tiene razón, y por tres motivos distintos:
 *
 * 1. **Buscar una fuente que justificara el 14 estaba mal planteado.** Ningún
 *    estudio puede decir cuántos días hace falta para conocer a UN chico: eso es
 *    una propiedad de ese chico, no del grooming.
 * 2. **No hay nada que pase el día 14 que no pasara el 13.** Indefendible
 *    delante de un padre.
 * 3. **El perfil y la ventana eran la misma cosa**, así que el sistema no podía
 *    conocer al chico más allá de tres semanas. Eso ya está separado: el perfil
 *    vive en `perfil.ts` y no tiene tope; la ventana es sólo el tramo reciente.
 *
 * ⚠ **Pero el mecanismo que el escalón tapaba es real:** el día 2, "saltó el
 * volumen" se calcula contra un día de historia. Eso es ruido, y avisar por
 * ruido gasta la confianza del chico, que es el activo del que depende todo.
 * Por eso el escalón no se borró: **se cambió por una rampa**, y la rampa
 * depende del chico y no del almanaque.
 *
 * 🔑 **Y la red de seguridad que vuelve todo esto seguro ya estaba:** la regla
 * de persistencia exige días sostenidos, así que el sistema no puede hablar de
 * golpe por más alcance que tenga. La protección de verdad siempre fue la
 * persistencia, no el interruptor.
 */

/**
 * Constante de tiempo de la rampa de historia, en días.
 *
 * 📌 **Decisión de producto, y a diferencia del 14 no pretende ser un hallazgo:**
 * no dice "a los 7 días conocemos al chico", dice a qué velocidad el sistema
 * deja de dudar. La curva es `1 - e^(-días/τ)`: 7 días ≈ 0,63 · 14 ≈ 0,86 ·
 * 30 ≈ 0,99. **Nunca salta y nunca llega del todo a 1.**
 */
export const TAU_HISTORIA_DIAS = 7;

/**
 * Cada cuántos días el perfil olvida la mitad de lo viejo.
 *
 * 🔑 Es la parte de *"son adolescentes y están permanentemente cambiando"*: lo
 * de hace dos meses pesa la cuarta parte que lo de esta semana. Un perfil que no
 * olvida convierte el crecimiento normal en anomalía.
 */
export const MEDIA_VIDA_PERFIL_DIAS = 30;

/**
 * Cuánta variabilidad **no explicada por la tendencia** se tolera antes de bajar
 * el alcance. 📌 Decisión de producto. Ver `variabilidadPonderada` en `perfil.ts`.
 */
export const DISPERSION_TOLERADA = 0.12;

/**
 * Piso del castigo por ser impredecible. Un chico errático baja el alcance, pero
 * **nunca lo anula**: si lo anulara, el chico más difícil de leer sería también
 * el más desprotegido, que es exactamente al revés de lo que queremos.
 */
export const REGULARIDAD_MINIMA = 0.6;

/* ── La ventana ──────────────────────────────────────────────────────────── */

/**
 * 📊 Sostenido en el estudio: el 90% de las víctimas sufre acoso cotidiano,
 * sostenido durante meses. Por eso la unidad de análisis es la semana y no
 * el evento.
 */
export const VENTANA_DIAS = 21;

/** Media ventana, para comparar la mitad reciente contra la anterior. */
export const MEDIA_VENTANA_DIAS = 7;
