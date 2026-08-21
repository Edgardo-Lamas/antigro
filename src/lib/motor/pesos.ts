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
import type { Genero, TurnoEscolar } from "@/lib/datos/tipos";

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
 * 📊 **Tres fuentes, y no dicen exactamente lo mismo. Por eso hay cuatro bandas
 * y no dos** (armado el 15/8/2026, reatribuido el 21/8):
 *
 * 1. **Informe Grooming LATAM** (Red Grooming LATAM, presentado en mayo de
 *    2025; n≈28.360 encuestas anónimas a NNyA de 9 a 17 en 14 países,
 *    relevamiento 2024/2025): la franja **más vulnerable es de 9 a 13**.
 *    Es, de lejos, la muestra más grande de las tres.
 *    https://groomingarg.org/informe-grooming-latam
 * 2. **ESET**, citado en el estado del arte del estudio nacional: el grueso
 *    entre **11 y 15** (52,9%), y un segundo grupo entre **7 y 10** (33,7%).
 * 3. **La medición propia del estudio nacional (Ministerio de Justicia, 2023):**
 *    **72,3% entre 12 y 14**, 14,5% entre 6 y 11, 14,5% entre 15 y 17.
 *    ⚠ Base: 23 casos. El estudio mismo aclara que con esa cantidad no publica
 *    cruces por no ser estadísticamente significativos.
 *
 * 🔴 **Lo que se corrigió el 21/8, y es de atribución, no de números:** las
 * bandas de ESET —11 a 15, y 7 a 10— estaban acá firmadas como si las hubiera
 * medido el Ministerio. No las midió: las resume en su estado del arte. Los
 * pesos NO se movieron, porque el dato de ESET sigue existiendo y sigue
 * sosteniendo lo mismo; lo que cambió es quién lo firma.
 *
 * ⬜ **Y queda una tensión abierta, que es decisión de producto y no de código:**
 * los 15 años pesan 0,97 apoyados **sólo en ESET**, mientras la medición propia
 * del estudio pone la franja de 15 a 17 en apenas 14,5%. Moverlo es elegir entre
 * una fuente citada y una muestra de 23 casos, así que no se movió solo.
 * 📌 Antes de tocarlo, leer la medición de abajo: la edad casi nunca mueve el DÍA.
 *
 * El criterio es simple y se puede defender delante de un padre: **pesa 1 donde
 * las fuentes coinciden** (11 a 13), un escalón menos donde lo nombra una
 * sola, y el piso donde no lo nombra ninguna.
 *
 * ⚠ El rango sigue siendo angosto a propósito (0,88 a 1). Un factor agresivo
 * dejaría a los de 16 y 17 por debajo del umbral, y eso no es lo que dice el
 * dato: dice dónde se concentran los casos, no dónde dejan de existir.
 */
export function factorEdad(edad: number): number {
  // Las tres fuentes coinciden: 11-13 cae en "9 a 13", en "11 a 15" y —12 y 13—
  // en el "12 a 14" que midió el estudio.
  if (edad >= 11 && edad <= 13) return 1;
  // Sólo Grooming LATAM los pone en la franja más vulnerable.
  if (edad >= 9 && edad <= 10) return 0.97;
  // 14: ESET y la medición propia del estudio. 15: ⬜ sólo ESET (ver arriba).
  if (edad >= 14 && edad <= 15) return 0.97;
  // "Segundo grupo importante" de ESET (7 a 10): acá quedan 7 y 8.
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
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL TURNO ESCOLAR CORRE LA MISMA HORA QUE LA EDAD (17/8)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **No es una mejora: es la reparación de algo que el sistema afirmaba sin
 * saberlo.** El 16/8 el asistente decía que la madrugada «desordena el
 * descanso», y Edgardo lo volteó: **el sistema no sabe a qué hora se levanta
 * ese chico.** Uno que entra al colegio a las 7:30 y otro que entra a las 13
 * no están haciendo lo mismo a las 23:30.
 *
 * 🔑 **Se enchufa en el mecanismo que ya existe y ya está probado.** La edad
 * corre esta misma hora, y el turno la corre un escalón más — para el mismo
 * lado o para el contrario, según de qué turno se trate.
 *
 * ⚠ **Esto es criterio de producto, no un dato, y no se cita como si lo fuera.**
 * A diferencia del corrimiento de fase de la adolescencia —que tiene fuente
 * clínica y está arriba—, acá no hay estudio que diga cuánto corre un turno
 * tarde. Una hora es lo mínimo que se puede mover sin que el cambio sea
 * decorativo, y lo máximo que se puede mover sin inventar precisión.
 *
 * 🔴 **Y nunca apaga la madrugada.** El corrimiento es de una hora, el piso de
 * `factorMadrugada` sigue en 0,55, y el techo está topado: ningún turno puede
 * empujar la referencia más allá de las 2 de la mañana. Un chico conectado a
 * las 3, todas las noches, sigue siendo señal vaya al turno que vaya.
 */
const CORRIMIENTO_POR_TURNO: Record<TurnoEscolar, number> = {
  /* Se levanta temprano: a las 23 ya le está sacando horas al sueño. */
  manana: -1,
  /* Puede dormir a la mañana, así que a las 23 todavía no significa lo mismo. */
  tarde: +1,
  /* Doble turno entra temprano igual: manda la hora a la que se levanta. */
  doble: -1,
  /* Vuelve del colegio de noche: a las 23 recién está llegando a la casa. */
  noche: +1,
  /* Sin colegio no hay hora de levantarse que el sistema pueda suponer, así
     que no se mueve nada. 📌 No es lo mismo que no contestar: es contestar que
     no hay horario, y el sistema deja de imaginarse uno. */
  no_va: 0,
};

/** Ningún turno corre la referencia más allá de las 02:00. */
const TOPE_REFERENCIA = 26;
/** Ni más acá de las 21:00. */
const PISO_REFERENCIA = 21;

/**
 * A partir de qué hora estar conectado ya no se explica por la edad.
 * 📌 Los cortes son decisión de producto, informados por el corrimiento de fase
 * de ~2 h documentado arriba. Devuelve la hora en formato 24 h.
 *
 * @param turno Si se sabe a qué turno va. Sin esto se comporta igual que antes.
 */
export function horaDeReferencia(edad: number, turno?: TurnoEscolar): number {
  let hora: number;
  if (edad <= 10) hora = 22;
  else if (edad <= 13) hora = 23;
  else if (edad <= 15) hora = 24;
  else hora = 25; // 01:00 del día siguiente

  if (turno) hora += CORRIMIENTO_POR_TURNO[turno];
  return Math.min(TOPE_REFERENCIA, Math.max(PISO_REFERENCIA, hora));
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

export function factorMadrugada(edad: number, hora: number, turno?: TurnoEscolar): number {
  // La madrugada cruza la medianoche: 01:00 son las 25 del día anterior.
  const horaCorrida = hora <= 12 ? hora + 24 : hora;
  const desvio = horaCorrida - horaDeReferencia(edad, turno);
  if (desvio <= 0) return PISO_MADRUGADA;
  return Math.min(1, PISO_MADRUGADA + (desvio / HORAS_AL_MAXIMO) * (1 - PISO_MADRUGADA));
}

/* ── Factor por género ───────────────────────────────────────────────────── */

/**
 * 📊 Medido por el estudio nacional: el **66,3% de las víctimas de grooming fue
 * de género femenino** y el 33,7% masculino.
 * ⚠ Acá decía «el 80% de las víctimas de acoso virtual infantil son nenas».
 * Corregido el 21/8: ese 80% es de UNESCO/CIPDH, mide bullying virtual y estaba
 * mal atribuido al estudio. **Y el dato real es bastante menos desparejo**, lo
 * que refuerza el guardarraíl en vez de debilitarlo.
 *
 * 🔴 Guardarraíl. El rango es todavía más angosto (0,94 a 1) y por una razón
 * que no es de cortesía: si el factor bajara de verdad para los varones, el
 * sistema los detectaría más tarde. Un tercio de las víctimas no es ruido — son
 * chicos reales, y son los que menos denuncian.
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
 * 📊 Lo que el estudio nacional mide de verdad sobre repetición: al **43,5% de
 * las víctimas la acosaron más de una vez**, contra un 29,3% una sola. Eso
 * sostiene que la unidad de análisis sea la semana y no el evento.
 * ⚠ Acá decía «el 90% sufre acoso cotidiano sostenido durante meses». Corregido
 * el 21/8: es de UNESCO/CIPDH, sobre bullying virtual. **El largo de la ventana
 * —21 días— no lo dice ninguna fuente: es una decisión de producto**, y conviene
 * no volver a presentarla como si saliera de un dato.
 */
export const VENTANA_DIAS = 21;

/** Media ventana, para comparar la mitad reciente contra la anterior. */
export const MEDIA_VENTANA_DIAS = 7;
