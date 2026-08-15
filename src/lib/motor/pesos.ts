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

/* ── La ventana ──────────────────────────────────────────────────────────── */

/**
 * 📊 Sostenido en el estudio: el 90% de las víctimas sufre acoso cotidiano,
 * sostenido durante meses. Por eso la unidad de análisis es la semana y no
 * el evento.
 */
export const VENTANA_DIAS = 21;

/** Media ventana, para comparar la mitad reciente contra la anterior. */
export const MEDIA_VENTANA_DIAS = 7;
