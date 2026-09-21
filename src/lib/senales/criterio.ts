/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUÉ HACE EL SISTEMA CON CADA CATEGORÍA — decidido por Edgardo el 21/9/2026
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  `categorias.ts` contesta **qué es** un sitio. Este archivo contesta **qué
 *  hace el sistema con eso**, que es una decisión de producto y no de código.
 *
 *  🔴 **Este archivo es PURO a propósito: no abre el índice ni toca `fs`.** El
 *  motor corre también en el navegador —la consola de la home y el panel lo
 *  llaman desde el cliente—, así que si el criterio arrastrara la lectura del
 *  archivo de 47 MB, el panel no compilaría. **La consulta al índice vive en
 *  `categorias.ts`, que sólo corre en el servidor**, y lo que viaja hasta el
 *  motor es el resultado, anotado en el contexto de la señal.
 *
 *  ─── 🔑 SU PLANTEO, QUE ES EL ORIGEN DE TODO ESTO ─────────────────────────
 *
 *  *"Si detectamos que el chico está metiéndose en un lugar peligroso, no
 *  podemos quedarnos callados, tenemos la obligación de dar una alerta… de esa
 *  manera convertimos a AntiGro en algo más potente sin caer en un sistema
 *  parental"*.
 *
 *  🔑 **Choca con la regla 5 —no se alerta por un evento, se alerta por un
 *  patrón sostenido— y aun así tiene razón.** La regla 5 nació para señales
 *  **ambiguas por naturaleza**: un salto de volumen, una noche despierto. Cada
 *  una sola puede ser cualquier cosa. **Una categoría de dominio no es ambigua
 *  de la misma manera**: un chico en un sitio de citas no es un pico que pueda
 *  ser ruido. No rompe la regla — **agrega caminos propios**, y el precedente ya
 *  está adentro del motor (`evasion_repetida` habla con dos intentos, sin
 *  esperar racha, porque esquivar un control es un acto deliberado).
 *
 *  ─── 🔴🔴 NINGUNA CATEGORÍA SOBRA ─────────────────────────────────────────
 *
 *  Él corrigió una primera versión de esta tabla que decía «nunca alerta» y
 *  «descarte»: *"todas suman poco pero suman… quizá la que suma poco rescata a
 *  uno y la que suma más rescata a diez, pero ese uno vale"*. **Lo que cambia
 *  entre una categoría y otra no es si entra: es qué hace el motor con ella.**
 *  Unas suben el riesgo, otras dan la línea base contra la que se mide, y otras
 *  existen para evitar un error.
 *
 *  📌 Y las que hoy no tienen uso identificado **se guardan igual**
 *  (`se_guarda`): quedan registradas desde el primer día, porque el histórico no
 *  se recupera hacia atrás.
 *
 *  ─── 🔴 NO CALLARSE NO ES ALERTAR ────────────────────────────────────────
 *
 *  El sistema tiene dos canales y los dos ya existen: **la alerta interrumpe**
 *  —suena el teléfono, escala si nadie la abre— y **el parte informa sin
 *  interrumpir**. Lo que no es captación se dice en el parte. Si un adulto
 *  recibiera el mismo tipo de mensaje por un sitio de apuestas y por un patrón
 *  sostenido de meses, la segunda perdería fuerza, y es la que no puede
 *  perderla.
 *
 *  ⚠ **Y la salvedad que gobierna cómo se redacta todo lo que salga de acá: el
 *  filtro ve la CONSULTA, no la visita.** Una publicidad incrustada genera la
 *  consulta de un dominio sin que el chico haya entrado a ningún lado. Por eso
 *  se dice *«el teléfono consultó un dominio catalogado como sitio de citas»* y
 *  nunca *«tu hijo entró a un sitio de citas»*, y jamás un diagnóstico.
 */

/* ── Qué puede hacer el sistema con una categoría ────────────────────────── */

export type QueHace =
  /** El hecho ya significa algo sin esperar a que se repita. */
  | "habla_a_la_primera"
  /** Sube el puntaje y **baja los días exigidos** antes de hablar. */
  | "pesa_y_adelanta"
  /** Alimenta la señal de evasión que el motor ya mira. */
  | "completa_la_evasion"
  /** Otro riesgo: se cuenta en el parte, sin alerta. */
  | "va_al_parte"
  /** Vida normal. No suma riesgo: **suma el denominador**. */
  | "linea_base"
  /** Suma evitando un error, que vale igual que sumar riesgo. */
  | "evita_el_falso_positivo"
  /** Entra y queda registrada. Todavía no decide nada. */
  | "se_guarda";

/** Cuándo el hecho solo no alcanza. Hoy hay una sola. */
export type Condicion =
  /**
   * 🔴 **Para `phishing` y `malware`, que son 537.330 dominios contra los 9.181
   * de las otras dos: 58 veces más superficie.** Un aviso por semana que no era
   * nada apaga al adulto para el día que sí lo es.
   *
   * ✅ **Por eso no hablan por aparecer, sino por cómo llegaron.** Un dominio de
   * malware suelto entre cuarenta consultas de una página es un rastreador
   * incrustado; el mismo dominio **inmediatamente después de un acortador o un
   * servicio de archivos** es un chico que hizo clic en un enlace que alguien le
   * mandó. **El DNS no ve el clic, pero ve la secuencia** — el mismo mecanismo
   * del cruce Roblox → WhatsApp que el motor ya usa.
   */
  "despues_de_un_enlace";

export interface Criterio {
  hace: QueHace;
  condicion?: Condicion;
  /** Cómo se nombra en castellano, para el texto que lee una persona. */
  esto: string;
  /** Por qué le toca eso. Va a la trazabilidad: nada se afirma sin su motivo. */
  porque: string;
}

/**
 * 🔴 **`dating` habla a la primera A CUALQUIER EDAD — lo decidió él el
 * 21/9/2026**, entre tres opciones y con el motivo dicho: todos los chicos del
 * sistema son menores y los sitios de citas son para mayores de 18. Son 8.744
 * dominios: no es algo que aparezca seguido, así que el riesgo de llenar de
 * avisos al adulto es bajo.
 * 📌 Revisable cuando salga a producción y se vea cuántos avisos genera de
 * verdad.
 */
export const CRITERIO: Record<string, Criterio> = {
  /* ── Hablan a la primera ─────────────────────────────────────────────── */
  stalkerware: {
    hace: "habla_a_la_primera",
    esto: "software espía a la venta",
    porque:
      "🔑 Es distinta a todo lo que el motor mira: no es conducta del chico, es alguien actuando SOBRE él. Si aparece en su teléfono, alguien pudo habérselo instalado.",
  },
  dating: {
    hace: "habla_a_la_primera",
    esto: "sitio de citas",
    porque: "Todos los chicos del sistema son menores y estos sitios son para mayores de 18.",
  },
  phishing: {
    hace: "habla_a_la_primera",
    condicion: "despues_de_un_enlace",
    esto: "sitio de engaño",
    porque: "La extorsión sexual casi siempre entra por un enlace.",
  },
  malware: {
    hace: "habla_a_la_primera",
    condicion: "despues_de_un_enlace",
    esto: "sitio con programas maliciosos",
    porque: "La extorsión sexual casi siempre entra por un enlace.",
  },

  /* ── Pesan fuerte y adelantan los días exigidos ──────────────────────── */
  chat: {
    hace: "pesa_y_adelanta",
    esto: "chat con desconocidos",
    porque: "Es donde empieza el contacto.",
  },
  shortener: {
    hace: "pesa_y_adelanta",
    esto: "acortador de enlaces",
    porque: "El acortador es el vehículo habitual del enlace.",
  },
  filehosting: {
    hace: "pesa_y_adelanta",
    esto: "sitio para subir archivos",
    porque: "Es donde se suben las fotos y los videos.",
  },
  redirector: {
    hace: "pesa_y_adelanta",
    esto: "sitio usado para esquivar filtros",
    porque: "Sirve para saltar un control sin que se note.",
  },
  strict_redirector: {
    hace: "pesa_y_adelanta",
    esto: "sitio usado para esquivar filtros",
    porque: "Sirve para saltar un control sin que se note.",
  },
  strong_redirector: {
    hace: "pesa_y_adelanta",
    esto: "sitio usado para esquivar filtros",
    porque: "Sirve para saltar un control sin que se note.",
  },
  adult: {
    hace: "pesa_y_adelanta",
    esto: "contenido para adultos",
    porque: "Exposición a contenido sexual.",
  },
  mixed_adult: {
    hace: "pesa_y_adelanta",
    esto: "contenido para adultos",
    porque: "Exposición a contenido sexual.",
  },
  lingerie: {
    hace: "pesa_y_adelanta",
    esto: "lencería",
    porque: "Exposición a contenido sexual.",
  },

  /* ── Completan la evasión que el motor ya mira ───────────────────────── */
  vpn: {
    hace: "completa_la_evasion",
    esto: "VPN",
    porque: "Evasión: completa lo que el motor ya mira con `claseDeEvasion()`.",
  },
  doh: {
    hace: "completa_la_evasion",
    esto: "DNS alternativo",
    porque: "Evasión: completa lo que el motor ya mira con `claseDeEvasion()`.",
  },
  "residential-proxies": {
    hace: "completa_la_evasion",
    esto: "proxy residencial",
    porque: "Evasión: completa lo que el motor ya mira con `claseDeEvasion()`.",
  },
  "dynamic-dns": {
    hace: "completa_la_evasion",
    esto: "DNS dinámico",
    porque: "Evasión: completa lo que el motor ya mira con `claseDeEvasion()`.",
  },

  /* ── Otro riesgo: van al parte, no a la alerta ───────────────────────── */
  gambling: {
    hace: "va_al_parte",
    esto: "apuestas",
    porque: "No es de lo que se ocupa este sistema, pero para esa casa puede ser lo único que importa.",
  },
  drogue: {
    hace: "va_al_parte",
    esto: "drogas",
    porque: "No es de lo que se ocupa este sistema, pero para esa casa puede ser lo único que importa.",
  },
  agressif: {
    hace: "va_al_parte",
    esto: "contenido violento o de odio",
    porque: "Otro riesgo que un padre querría saber igual.",
  },
  sect: {
    hace: "va_al_parte",
    esto: "sectas",
    porque: "Otro riesgo que un padre querría saber igual.",
  },
  fakenews: {
    hace: "va_al_parte",
    esto: "desinformación",
    porque: "Otro riesgo que un padre querría saber igual.",
  },

  /* ── Dan la línea base ───────────────────────────────────────────────── */
  games: {
    hace: "linea_base",
    esto: "juegos",
    porque:
      "🔑 Sin esto no se sabe qué es desviarse: el juego de todos los días contaría como lugar desconocido.",
  },
  social_networks: {
    hace: "linea_base",
    esto: "red social",
    porque: "Vida normal del chico. Sirve para la línea base, no para alertar.",
  },
  manga: { hace: "linea_base", esto: "manga", porque: "Vida normal del chico." },
  blog: { hace: "linea_base", esto: "blog", porque: "Vida normal del chico." },
  forums: { hace: "linea_base", esto: "foro", porque: "Vida normal del chico." },
  webmail: { hace: "linea_base", esto: "correo web", porque: "Vida normal del chico." },

  /* ── Protegen del falso positivo ─────────────────────────────────────── */
  publicite: {
    hace: "evita_el_falso_positivo",
    esto: "publicidad y rastreadores",
    porque: "🔴 Se reconoce para DESCARTARLO: si no, un rastreador se cuenta como lugar nuevo.",
  },
  update: {
    hace: "evita_el_falso_positivo",
    esto: "actualizaciones de programas",
    porque: "🔴 Se reconoce para DESCARTARLO: no lo eligió nadie, lo pidió el aparato solo.",
  },
  marketingware: {
    hace: "evita_el_falso_positivo",
    esto: "rastreo comercial",
    porque: "🔴 Se reconoce para DESCARTARLO: si no, un rastreador se cuenta como lugar nuevo.",
  },
  sexual_education: {
    hace: "evita_el_falso_positivo",
    esto: "educación sexual",
    porque:
      "🔑 Existe para NO confundirla con pornografía, y hace falta: cinco de los quince sitios de esta categoría están también en `adult`.",
  },
};

/**
 * 🔑 **Las categorías que son «el enlace», para la condición de `phishing` y
 * `malware`.** Un dominio de malware **inmediatamente después** de uno de éstos
 * es un chico que hizo clic en algo que le mandaron; suelto, es un rastreador
 * incrustado en una página.
 */
export const CATEGORIAS_DE_ENLACE = ["shortener", "filehosting"];

/* ── Resolver un dominio que cae en varias categorías ─────────────────────── */

/**
 * 🔑 **Un dominio suele tener más de una categoría** —`badoo.com` es `blog`,
 * `dating` y `social_networks` a la vez— así que hace falta un desempate, y no
 * alcanza con «gana la más fuerte». Las dos excepciones salen de mirar la lista
 * de verdad, no de suponer:
 *
 * 1. 🔴 **`sexual_education` le gana a `adult`.** Cinco de sus quince sitios
 *    están en las dos —`kinseyconfidential.org`, `masexualite.ca`— y esa
 *    categoría existe **justamente** para que no se lean como pornografía. Si
 *    ganara la más fuerte, la categoría anti-falso-positivo no serviría de nada.
 * 2. 🔴 **`publicite` y `update` no le ganan a nada peligroso.** Descartan sólo
 *    cuando son la ÚNICA lectura del dominio: hay diez dominios que son
 *    publicidad **y** malware, y ahí manda el riesgo.
 */
const FUERZA: Record<QueHace, number> = {
  habla_a_la_primera: 6,
  pesa_y_adelanta: 5,
  completa_la_evasion: 4,
  va_al_parte: 3,
  linea_base: 2,
  evita_el_falso_positivo: 1,
  se_guarda: 0,
};

const SE_GUARDA: Criterio = {
  hace: "se_guarda",
  esto: "un lugar catalogado",
  porque: "Entra y queda registrada: el histórico no se recupera hacia atrás.",
};

/**
 * El desempate, aparte de la consulta: así se puede probar con combinaciones
 * armadas a mano, sin depender de qué dominio esté hoy en la lista de UT1 — que
 * en `phishing` y `malware` cambia todos los días.
 */
export function desempatar(categorias: string[]): { categoria: string; criterio: Criterio } {
  const conCriterio = categorias.map((c) => ({ categoria: c, criterio: CRITERIO[c] ?? SE_GUARDA }));

  /* Excepción 1: la educación sexual le gana al contenido adulto. */
  const educacion = conCriterio.find((c) => c.categoria === "sexual_education");
  /* Excepción 2: el ruido sólo manda cuando es lo único que hay. */
  const algoMas = conCriterio.filter((c) => c.criterio.hace !== "evita_el_falso_positivo");

  const candidatos = educacion ? [educacion] : algoMas.length > 0 ? algoMas : conCriterio;
  return candidatos.reduce((mejor, actual) =>
    FUERZA[actual.criterio.hace] > FUERZA[mejor.criterio.hace] ? actual : mejor,
  );
}

/**
 * La frase con la que esto se dice, **sin interpretación y sin fecha**: la fecha
 * la pone quien escribe el aviso, con el formato del país de la familia.
 *
 * ⚠ Dice «el teléfono consultó», no «tu hijo entró». Ver la salvedad del
 * encabezado: el filtro ve la consulta, no la visita.
 */
export function comoSeDice(esto: string): string {
  return `el teléfono consultó un dominio catalogado como ${esto}`;
}
