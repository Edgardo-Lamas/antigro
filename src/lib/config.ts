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
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS RECURSOS OFICIALES — ESPAÑA. Reemplazaron a los argentinos el 19/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Cada dato de acá se abrió en la fuente oficial el 19/9**, uno por uno:
 * `incibe.es`, `anar.org`, `aepd.es` y `policia.es`. Ninguno salió de memoria ni
 * de un resumen. La regla de la casa vale doble acá: si el sistema le da a un
 * padre un teléfono equivocado en el peor momento, no hay nada que lo compense.
 *
 * 🔑 **Por qué son CUATRO y no uno.** En Argentina la Línea 137 cubría todo: era
 * estatal, gratuita y de 24 horas. En España ese teléfono único no existe, y el
 * reparto no es burocracia: es que cada uno atiende algo distinto.
 *   · El **017** sabe de grooming y de internet, pero **cierra a las 23:00** —
 *     y la señal de madrugada, que es la que este sistema ve, cae fuera.
 *   · El de **ANAR** atiende a cualquier hora, con psicólogos, y es el que
 *     queda cuando el padre mira el panel a las tres de la mañana.
 *   · La **AEPD** no aconseja: ordena retirar. Es para cuando la foto ya circula.
 *   · La **Policía** es la denuncia, y va al final, nunca primero.
 *
 * 📌 El sistema deriva por HORA y por SITUACIÓN, no por preferencia.
 */
export const RECURSOS = {
  /**
   * El que más sabe del problema exacto: INCIBE, el instituto nacional de
   * ciberseguridad. Asesora al entorno del menor —padres y educadores— en lo
   * psicosocial, lo técnico y lo legal. 🔴 No atiende de 23:00 a 8:00.
   */
  incibe: {
    nombre: "017",
    queEs: "Tu Ayuda en Ciberseguridad, del INCIBE",
    detalle: "Gratuito y confidencial. Asesoramiento psicosocial, técnico y legal",
    telefono: "017",
    whatsapp: "900 116 117",
    telegram: "@INCIBE017",
    horario: "De 8:00 a 23:00, todos los días del año",
    url: "https://www.incibe.es/linea-de-ayuda-en-ciberseguridad",
  },

  /**
   * 🔑 **El que sostiene la madrugada.** Es el que se le nombra al adulto cuando
   * el 017 está cerrado, y el único de los cuatro que atiende siempre.
   */
  anarFamilia: {
    nombre: "Teléfono ANAR de la Familia y los Centros Escolares",
    queEs: "Fundación ANAR",
    detalle: "Gratuito, confidencial y atendido por psicólogos",
    telefono: "600 50 51 52",
    horario: "24 horas, los 365 días del año",
    url: "https://www.anar.org/telefono-anar-familia-y-centros-escolares/",
  },

  /**
   * 🔴 **Éste es del CHICO, no del padre, y no se los mezcla.** Lo atiende un
   * psicólogo y el chico puede llamar sin que nadie de la casa se entere.
   * 📌 El `116 111` es el número europeo de ayuda a la infancia, pero en España
   * no llega a todas las comunidades: por eso el que se muestra primero es el
   * 900, que sí funciona en todo el país.
   */
  anarMenor: {
    nombre: "Teléfono ANAR de Ayuda a Niños/as y Adolescentes",
    queEs: "Fundación ANAR",
    detalle: "Gratuito y confidencial, atendido por psicólogos",
    telefono: "900 20 20 10",
    telefonoEuropeo: "116 111",
    horario: "24 horas, los 365 días del año",
    url: "https://www.anar.org/telefono-chat-anar/",
  },

  /**
   * Para cuando ya hay una foto o un vídeo circulando. No orienta: tramita la
   * retirada urgente. 🔑 Un adolescente de 14 a 17 puede acudir por sí mismo.
   */
  aepd: {
    nombre: "Canal prioritario de la AEPD",
    queEs: "Agencia Española de Protección de Datos",
    detalle:
      "Retirada urgente de fotografías, vídeos o audios de contenido sexual o violento " +
      "difundidos sin permiso de la persona afectada",
    url: "https://www.aepd.es/canalprioritario",
  },

  /**
   * La denuncia. 📌 Va al final del camino y sólo cuando el adulto ya decidió:
   * el sistema no denuncia, no afirma que hubo delito y no empuja a hacerlo.
   */
  policia: {
    nombre: "Policía Nacional",
    detalle: "Denuncia de delitos sexuales contra menores cometidos por internet",
    telefono: "091",
    emergencias: "112",
    correo: "denuncias.pornografia.infantil@policia.es",
    url: "https://www.policia.es/_es/denuncias.php",
  },
} as const;

/**
 * Marco legal español. Se cita, no se interpreta. Verificado en el BOE el 19/9.
 *
 * 🔴🔴 **El grooming está en el artículo 183, NO en el 183 ter.** La Ley Orgánica
 * 10/2022 renumeró el capítulo con efectos del 7/10/2022, y prácticamente todo lo
 * que hay escrito por ahí —incluidas guías de divulgación— sigue citando el 183
 * ter, que hoy ya no dice eso. Un jurado español que vaya a comprobarlo va a
 * encontrar bien lo nuestro y mal lo de al lado.
 *
 * 🔑 **El art. 15 de la LOPIVI es el que le da sentido legal a todo el producto**:
 * en España, advertir indicios y no comunicarlos no es una opción personal.
 */
export const MARCO_LEGAL = {
  cp183:
    "Código Penal, art. 183 — contactar por internet con un menor de 16 años y proponerle " +
    "un encuentro, con actos materiales de acercamiento: 1 a 3 años de prisión. Embaucarle " +
    "para que facilite material pornográfico: 6 meses a 2 años.",
  lopivi:
    "Ley Orgánica 8/2021 de protección integral a la infancia y la adolescencia frente a la " +
    "violencia, art. 15 — quien advierte indicios de violencia sobre un menor está obligado " +
    "a comunicarlo de forma inmediata.",
  consentimiento:
    "LOPDGDD (Ley Orgánica 3/2018), art. 7 — a partir de los 14 años el menor consiente por " +
    "sí mismo el tratamiento de sus datos; por debajo, consiente quien tiene la patria potestad.",
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
