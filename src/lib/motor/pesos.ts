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
 * 📊 Sostenido en el estudio: el grueso de las víctimas está entre los 11 y los
 * 15 años, con un segundo grupo importante entre los 7 y los 10.
 *
 * ⚠ El rango es angosto a propósito (0,88 a 1). Un factor agresivo dejaría a
 * los de 16 y 17 por debajo del umbral, y eso no es lo que dice el dato: dice
 * dónde se concentran los casos, no dónde dejan de existir.
 */
export function factorEdad(edad: number): number {
  if (edad >= 11 && edad <= 15) return 1;
  if (edad >= 7 && edad <= 10) return 0.94;
  return 0.88;
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
 * - `absoluta` — no se compara contra nada. Conectarse de madrugada todos los
 *   días es desordenado en sí mismo: al otro día no descansó para la escuela.
 *   Intentar saltar el filtro es un acto deliberado, sea el día 2 o el 200.
 *   **Funcionan desde el minuto uno.**
 * - `relativa` — "saltó el volumen", "apareció una plataforma nueva". Sólo
 *   significan algo contra la conducta previa del propio chico, así que
 *   esperan a que la línea de base exista.
 */
export type ClaseDeSenal = "absoluta" | "relativa";

export const CLASE_DE_SENAL: Record<TipoDeSenal, ClaseDeSenal> = {
  // Desordena el descanso: es dañino por sí mismo, no por ser distinto.
  madrugada: "absoluta",
  // Acto deliberado de esquivar el control. No hay historia que lo relativice.
  evasion: "absoluta",
  // "Saltó" sólo tiene sentido contra el volumen habitual de ese chico.
  volumen: "relativa",
  // "Nueva" está definido contra lo que aparecía antes. Sin antes, no hay nueva.
  plataforma_nueva: "relativa",
};

/**
 * 📌 **PENDIENTE DE INVESTIGACIÓN — no fijar este número sin fuente.**
 *
 * Cuántos días hay que observar antes de poder afirmar "esto se desvía de lo
 * habitual en este chico". Hoy está en 14 por dos razones defendibles, pero
 * **ninguna fuente es sobre grooming ni sobre menores**:
 *
 * 1. La conducta cambia entre días de semana y fin de semana (los fines de
 *    semana suman ~30 min/día de pantalla en chicos y chicas). Con una sola
 *    semana hay una muestra de cada día, y no se puede separar "los martes
 *    siempre usa mucho" de "este martes estuvo raro". Hacen falta dos de cada.
 * 2. La detección de anomalías por conducta en redes fija 7 días como piso
 *    absoluto y 30 como el punto en que es confiable (Microsoft Sentinel).
 *
 * ⚠ Si un padre pregunta "¿por qué 14?", la respuesta honesta incluye que no
 * hay un estudio específico del dominio que fije el número. Investigar.
 */
export const APRENDIZAJE_DIAS = 14;

/* ── La ventana ──────────────────────────────────────────────────────────── */

/**
 * 📊 Sostenido en el estudio: el 90% de las víctimas sufre acoso cotidiano,
 * sostenido durante meses. Por eso la unidad de análisis es la semana y no
 * el evento.
 */
export const VENTANA_DIAS = 21;

/** Media ventana, para comparar la mitad reciente contra la anterior. */
export const MEDIA_VENTANA_DIAS = 7;
