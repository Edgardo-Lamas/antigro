/** Constantes del producto. Lo que se muestra sale de acá, no de cada archivo. */

export const PRODUCTO = "AntiGro";

export const BAJADA =
  "Percibe señales de que un chico puede estar siendo acosado en internet, sin leer un solo mensaje suyo.";

/**
 * Recursos oficiales a los que el sistema deriva.
 * 🔴 Cuando la respuesta correcta es un adulto o la Línea 137, el sistema lo dice.
 */
export const RECURSOS = {
  linea137: {
    nombre: "Línea 137",
    detalle: "Programa Las Víctimas Contra Las Violencias — atención las 24 horas",
    telefono: "137",
    whatsapp: "+54 9 11 3133-1000",
  },
  gapp: {
    nombre: "GAPP",
    detalle: "App de denuncia de Grooming Argentina",
    url: "https://www.grooming.org.ar/",
  },
} as const;

/**
 * Marco legal argentino. Se cita, no se interpreta.
 * Fuente: Estudio nacional sobre acoso sexual a NNyA mediante TIC,
 * Ministerio de Justicia y Derechos Humanos de la Nación, 2023.
 */
export const MARCO_LEGAL = {
  ley26904: "Ley 26.904 (2013) — art. 131 del Código Penal: 6 meses a 4 años.",
  ley27590: "Ley 27.590 «Mica Ortega» (2020) — Programa Nacional de Prevención.",
} as const;

/** Bandas de edad del mensaje al chico. Salen de los datos, no de una corazonada. */
export const BANDAS_DE_EDAD = [
  { id: "7-10", desde: 7, hasta: 10 },
  { id: "11-13", desde: 11, hasta: 13 },
  { id: "14-17", desde: 14, hasta: 17 },
] as const;

export type BandaDeEdad = (typeof BANDAS_DE_EDAD)[number]["id"];

export function bandaDeEdad(edad: number): BandaDeEdad {
  if (edad <= 10) return "7-10";
  if (edad <= 13) return "11-13";
  return "14-17";
}
