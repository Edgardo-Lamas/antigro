/** Constantes del producto. Lo que se muestra sale de acá, no de cada archivo. */

export const PRODUCTO = "AntiGro";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CÓMO SE EXPLICA LA INSTALACIÓN — reescrito el 17/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Estaba escrito en nuestro idioma y Edgardo lo frenó**, señalando cada
 * hueco: *"«se le dice al aparato a qué servidor de nombres preguntar, y ese
 * servidor anota…» ¿a qué aparato? ¿a qué servidor de nombres preguntar? ¿y ese
 * servidor, cuál? ESTÁ MAL EXPLICADO"*. Las tres preguntas eran correctas: el
 * texto no decía en qué aparato, no decía qué es un servidor de nombres, y
 * nombraba «ese servidor» sin haber dicho nunca cuál.
 *
 * 🔑 **Vive acá, en un solo lugar, porque estaba escrito de cuatro maneras
 * distintas** —en la guía, en el panel, en el recorrido y en `instalacion.ts`—
 * y arreglarlo significaba acordarse de los cuatro. Es la explicación que más
 * veces lee un padre y la que decide si confía o desinstala.
 *
 * 📌 **El orden no se toca:** primero qué NO es, después la comparación, y
 * recién al final el paso técnico. Al revés, un padre siente que le están
 * pidiendo poner un espía en el teléfono del hijo.
 */
export const COMO_FUNCIONA = {
  /** Lo primero, siempre. */
  noEs: "No se instala ninguna aplicación, ni nada que mire lo que el chico escribe.",

  /**
   * 🔑 La comparación con la guía telefónica es lo que hace entendible todo lo
   * demás. Sin ella, «servidor de nombres» no significa nada para nadie.
   */
  laComparacion:
    "Cada vez que un teléfono abre algo —un juego, una red social, cualquier página— " +
    "primero tiene que averiguar dónde queda, como buscar un número en una guía " +
    "telefónica. Hoy esa consulta se la hace a la empresa que te da internet.",

  /** Qué cambia, dicho sin una sola palabra técnica. */
  queCambia:
    "Lo único que se cambia es a quién se le hace esa consulta: en vez de a la empresa " +
    "de internet, pasa a hacérsela a NextDNS, un servicio que además de contestarla " +
    "deja anotado qué se consultó y a qué hora.",

  /** 🔴 Y el límite, que es lo que sostiene la promesa. */
  elLimite:
    "Eso es todo lo que ve AntiGro: nombres de sitios y horarios. Los mensajes no " +
    "pasan por ahí, así que no se leen — y no es que no queramos: no se puede.",

  /**
   * 🔴 En el aparato del chico, no en el router. **No es una preferencia:** el
   * router no ve los datos móviles, y ahí vive la señal de madrugada.
   */
  donde:
    "Se hace en el teléfono del chico, no en el router de la casa. Así lo sigue " +
    "viendo cuando sale con datos móviles y cuando está en otra casa.",
} as const;

export const BAJADA =
  "Percibe señales de que un chico puede estar siendo acosado en internet, sin leer un solo mensaje suyo.";

/**
 * La segunda mitad de la frase con la que se presenta el producto: el CÓMO.
 *
 * 🔑 **Van separadas porque se usan separadas.** `BAJADA` es la descripción del
 * sitio y responde *qué hace*; ésta responde *de dónde saca lo que dice*, y es
 * lo que sostiene la credibilidad de la otra. Juntas son el primer párrafo del
 * README, palabra por palabra.
 *
 * 📌 Vive acá desde el 20/8, cuando la imagen de vista previa la necesitó. Antes
 * estaba sólo en el README y en `/guia`, o sea escrita dos veces y sin dueño.
 */
export const LO_QUE_CRUZA =
  "Cruza lo que ve la red, lo que observan los adultos y lo que dicen las estadísticas " +
  "oficiales sobre qué pesa cuánto.";

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
 * Eso no se discute y no depende de la edad: el 43% de los chicos dice no hablar
 * sobre los riesgos en Internet con sus padres (encuesta en 11 escuelas, citada
 * en el estudio nacional 2023), así que el segundo adulto no es redundancia.
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
