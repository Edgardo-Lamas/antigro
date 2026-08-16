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

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  EL REFERENTE DEL CHICO — quién lo elige (decidido con Edgardo el 16/8)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 🔑 **El adulto de confianza fuera de los padres existe en TODAS las edades.**
 * Eso no se discute y no depende de la edad: el 43% de los chicos no habla de
 * estos temas con sus padres, así que el segundo adulto no es redundancia.
 *
 * 🔴 **Lo que sí depende de la edad es quién lo elige.** Lo planteó Edgardo:
 * *"un chico de 7 años no tiene la capacidad de decidir ese tema"*. Tiene
 * razón, y el sistema no puede fingir que una elección de un nene de 7 es
 * equivalente a la de uno de 15.
 *
 * ⚠ **Este número es criterio de producto, no un dato.** No hay ninguna
 * fuente del dominio que fije una edad para elegir un confidente, y no hay
 * que citarlo como si la hubiera. Está en 11 porque es donde ya cortan las
 * bandas del sistema —y porque el informe LATAM declara 9 a 13 como la franja
 * más vulnerable, así que a esa altura el chico ya está adentro del problema
 * que el referente viene a resolver.
 *
 * 📌 Es un valor por defecto, no un muro: existe el nene de 9 maduro y el de
 * 13 que no quiere elegir a nadie. Los padres lo pueden mover en el alta.
 */
export const EDAD_PARA_ELEGIR_REFERENTE = 11;

/** De 11 para arriba elige el chico; abajo, lo eligen los padres. */
export function quienEligeAlReferente(edad: number): "el_chico" | "los_padres" {
  return edad >= EDAD_PARA_ELEGIR_REFERENTE ? "el_chico" : "los_padres";
}
