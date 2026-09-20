/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA CAPA DE PAÍS — lo idea Edgardo el 2026-09-19
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **De dónde sale.** Al pasar el producto a España, lo primero que hice fue
 *  reemplazar los teléfonos y las normas argentinas por las españolas. Él lo
 *  frenó: *"¿por qué en lugar de eliminar las citas del Ministerio de Justicia
 *  de Argentina, dejamos las dos opciones y el agente debería usar según sea el
 *  país?"*. Tenía razón: el material argentino está verificado y no está mal,
 *  está en otro país.
 *
 *  🔑 **Y lo que el producto gana no es ahorro de trabajo.** El grooming es el
 *  mismo problema en los dos lados y el motor no cambia ni una línea: lo único
 *  que cambia es **a quién se llama y qué artículo se cita**. Con esto AntiGro
 *  deja de ser un producto argentino traducido y pasa a ser un motor con una
 *  capa de país que son datos. Agregar Portugal o Italia es agregar una entrada
 *  acá, no tocar el sistema.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  🔴🔴 LA REGLA QUE HACE QUE ESTO NO SEA UN PELIGRO
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  **El país lo elige el CÓDIGO, antes de armar el prompt. El modelo recibe una
 *  sola lista y nunca ve la otra.**
 *
 *  Pasarle las dos con un «usá la que corresponda» es cuestión de tiempo hasta
 *  que le dé a un padre de Madrid la Línea 137, o a una madre de Lanús el 017.
 *  Un teléfono que no atiende, dado en el peor momento, es el peor error que
 *  puede cometer este producto: no falla ruidosamente como un error de código,
 *  falla en silencio y del otro lado hay alguien esperando que alguien atienda.
 *
 *  📌 Por eso todo lo de acá se consume por función —`recursosDe(pais)`— y no
 *  hay ningún lugar donde las dos listas queden juntas en un mismo texto.
 */

export type Pais = "ES" | "AR";

/**
 * 🔴 **España es el que está puesto, y es una decisión, no un descuido.** El
 * producto se presenta al concurso de IEBS, que es español, y quien lo abre es
 * un jurado español. El día que el país se elija en el alta, esto pasa a ser
 * sólo el valor por defecto de ese campo.
 */
export const PAIS_POR_DEFECTO: Pais = "ES";

export const NOMBRE_DEL_PAIS: Record<Pais, string> = {
  ES: "España",
  AR: "Argentina",
};

/** A quién le sirve cada recurso. Un recurso puede servirle a más de uno. */
export type Destinatario =
  /** El adulto de la casa. */
  | "adulto"
  /** 🔴 El chico, y no es lo mismo: hay países donde tiene un número propio. */
  | "chico"
  /** Cuando ya hay una foto o un vídeo circulando y hay que bajarlo. */
  | "retirada"
  /** La denuncia. Va al final del camino, nunca primero. */
  | "denuncia";

export interface RecursoDeAyuda {
  id: string;
  nombre: string;
  /** De quién es, cuando el nombre no lo dice. */
  queEs?: string;
  detalle: string;
  telefono?: string;
  whatsapp?: string;
  telegram?: string;
  correo?: string;
  /** Un segundo número para el mismo recurso (el europeo 116 111, por ejemplo). */
  telefonoAlterno?: string;
  horario?: string;
  url?: string;
  para: Destinatario[];
  /**
   * 🔴 **No es un adorno: decide a quién se nombra a las tres de la mañana.**
   * La señal que este sistema ve mejor es la de madrugada, así que un recurso
   * que cierra por la noche no puede ser el único que se le dé a un adulto.
   */
  cubre24h: boolean;
  /** Día en que se abrió la fuente y se comparó. */
  verificado: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOS RECURSOS, PAÍS POR PAÍS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🔴 Cada dato se abrió en su fuente oficial el día que dice `verificado`.
 * Ninguno salió de memoria ni de un resumen. Si el sistema le da a un padre un
 * teléfono equivocado en el peor momento, no hay nada que lo compense.
 */
export const RECURSOS_POR_PAIS: Record<Pais, RecursoDeAyuda[]> = {
  /* ── España — verificado el 19/9 en incibe.es, anar.org, aepd.es y policia.es ── */
  ES: [
    {
      /**
       * El que más sabe del problema exacto: el instituto nacional de
       * ciberseguridad. Asesora al entorno del menor —padres y educadores— en
       * lo psicosocial, lo técnico y lo legal. 🔴 Cierra de 23:00 a 8:00.
       */
      id: "incibe-017",
      nombre: "017",
      queEs: "Tu Ayuda en Ciberseguridad, del INCIBE",
      detalle: "Gratuito y confidencial. Asesoramiento psicosocial, técnico y legal",
      telefono: "017",
      whatsapp: "900 116 117",
      telegram: "@INCIBE017",
      horario: "De 8:00 a 23:00, todos los días del año",
      url: "https://www.incibe.es/linea-de-ayuda-en-ciberseguridad",
      para: ["adulto"],
      cubre24h: false,
      verificado: "2026-09-19",
    },
    {
      /** 🔑 El que sostiene la madrugada, que es cuando este sistema ve. */
      id: "anar-familia",
      nombre: "Teléfono ANAR de la Familia y los Centros Escolares",
      queEs: "Fundación ANAR",
      detalle: "Gratuito, confidencial y atendido por psicólogos",
      telefono: "600 50 51 52",
      horario: "24 horas, los 365 días del año",
      url: "https://www.anar.org/telefono-anar-familia-y-centros-escolares/",
      para: ["adulto"],
      cubre24h: true,
      verificado: "2026-09-19",
    },
    {
      /**
       * 🔴 Éste es del CHICO, y no se lo mezcla con el del padre. Lo atiende un
       * psicólogo y puede llamar sin que nadie de la casa se entere.
       * 📌 El `116 111` es el número europeo de ayuda a la infancia, pero en
       * España no llega a todas las comunidades: por eso el que se muestra
       * primero es el 900, que sí funciona en todo el país.
       */
      id: "anar-menor",
      nombre: "Teléfono ANAR de Ayuda a Niños/as y Adolescentes",
      queEs: "Fundación ANAR",
      detalle: "Gratuito y confidencial, atendido por psicólogos",
      telefono: "900 20 20 10",
      telefonoAlterno: "116 111",
      horario: "24 horas, los 365 días del año",
      url: "https://www.anar.org/telefono-chat-anar/",
      para: ["chico"],
      cubre24h: true,
      verificado: "2026-09-19",
    },
    {
      /** No orienta: tramita la retirada. 🔑 De 14 a 17 se puede acudir solo. */
      id: "aepd-canal-prioritario",
      nombre: "Canal prioritario de la AEPD",
      queEs: "Agencia Española de Protección de Datos",
      detalle:
        "Retirada urgente de fotografías, vídeos o audios de contenido sexual o violento " +
        "difundidos sin permiso de la persona afectada",
      url: "https://www.aepd.es/canalprioritario",
      para: ["retirada", "chico"],
      cubre24h: false,
      verificado: "2026-09-19",
    },
    {
      id: "policia-nacional",
      nombre: "Policía Nacional",
      detalle: "Denuncia de delitos sexuales contra menores cometidos por internet",
      telefono: "091",
      telefonoAlterno: "112",
      correo: "denuncias.pornografia.infantil@policia.es",
      url: "https://www.policia.es/_es/denuncias.php",
      para: ["denuncia"],
      cubre24h: true,
      verificado: "2026-09-19",
    },
  ],

  /* ── Argentina — lo que el producto ya tenía, verificado el 18/8 ─────────── */
  AR: [
    {
      /**
       * 🔑 **Acá un solo teléfono cubre lo que en España necesita tres.** Es
       * estatal, gratuito, de 24 horas, y atiende tanto al adulto como al
       * chico. Esa diferencia es la razón por la que este archivo existe: no
       * alcanzaba con cambiar el número, había que cambiar la forma.
       */
      id: "linea-137",
      nombre: "Línea 137",
      queEs: "Programa Las Víctimas Contra Las Violencias",
      detalle: "Gratuita y confidencial, atendida por profesionales",
      telefono: "137",
      whatsapp: "+54 9 11 3133-1000",
      horario: "24 horas, todos los días del año",
      para: ["adulto", "chico"],
      cubre24h: true,
      verificado: "2026-08-18",
    },
    {
      id: "gapp",
      nombre: "GAPP",
      queEs: "Grooming Argentina",
      detalle: "App de denuncia de grooming",
      url: "https://www.grooming.org.ar/",
      para: ["denuncia"],
      cubre24h: false,
      verificado: "2026-08-18",
    },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════
   CÓMO SE PIDEN — 🔴 siempre por función, nunca las dos listas juntas
   ═══════════════════════════════════════════════════════════════════════════ */

export function recursosDe(pais: Pais = PAIS_POR_DEFECTO): RecursoDeAyuda[] {
  return RECURSOS_POR_PAIS[pais];
}

export function recursosPara(
  destinatario: Destinatario,
  pais: Pais = PAIS_POR_DEFECTO,
): RecursoDeAyuda[] {
  return recursosDe(pais).filter((r) => r.para.includes(destinatario));
}

/**
 * 🔴 **El que se nombra cuando no se sabe qué hora es, que es casi siempre.**
 * Revienta si un país no tiene ninguno abierto las 24 horas, y es a propósito:
 * un país cargado a medias tiene que fallar en el build y no a las 3 AM.
 */
export function ayudaDeSiempre(
  destinatario: Destinatario,
  pais: Pais = PAIS_POR_DEFECTO,
): RecursoDeAyuda {
  const abierto = recursosPara(destinatario, pais).find((r) => r.cubre24h);
  if (!abierto) {
    throw new Error(
      `El país ${pais} no tiene ningún recurso de 24 horas para «${destinatario}». ` +
        `Cargalo antes de habilitar ese país.`,
    );
  }
  return abierto;
}

/** El que sabe más pero tiene horario, si el país tiene alguno así. */
export function ayudaConHorario(
  destinatario: Destinatario,
  pais: Pais = PAIS_POR_DEFECTO,
): RecursoDeAyuda | undefined {
  return recursosPara(destinatario, pais).find((r) => !r.cubre24h && r.telefono);
}

/**
 * Cómo se nombra un recurso dentro de una frase. 📌 Vive acá para que el
 * teléfono no quede escrito a mano en seis archivos: el día que cambie, cambia
 * en uno.
 */
export function comoSeLoNombra(r: RecursoDeAyuda): string {
  const numero = r.telefono ? `, ${r.telefono}` : "";
  const cuando = r.horario ? ` (${r.horario.toLowerCase()})` : "";
  return `${r.nombre}${numero}${cuando}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL MARCO LEGAL, PAÍS POR PAÍS
   ═══════════════════════════════════════════════════════════════════════════ */

export interface MarcoLegal {
  /** El artículo que tipifica el grooming. Se cita, no se interpreta. */
  grooming: string;
  /** La norma de protección de la infancia que enmarca al producto. */
  proteccion: string;
  /** Qué dice el país sobre los datos de un menor. */
  datos: string;
}

export const MARCO_LEGAL_POR_PAIS: Record<Pais, MarcoLegal> = {
  /**
   * 🔴🔴 **El grooming está en el artículo 183, NO en el 183 ter.** La Ley
   * Orgánica 10/2022 renumeró el capítulo con efectos del 7/10/2022, y
   * prácticamente todo lo que hay publicado —guías de divulgación incluidas—
   * sigue citando el 183 ter, que hoy dice otra cosa. Verificado en el BOE el
   * 19/9. Si alguien lo «corrige», mandarlo al BOE antes.
   */
  ES: {
    grooming:
      "Código Penal, art. 183 — contactar por internet con un menor de 16 años y proponerle " +
      "un encuentro, con actos materiales de acercamiento: 1 a 3 años de prisión. Embaucarle " +
      "para que facilite material pornográfico: 6 meses a 2 años.",
    proteccion:
      "Ley Orgánica 8/2021 de protección integral a la infancia y la adolescencia frente a la " +
      "violencia, art. 15 — quien advierte indicios de violencia sobre un menor está obligado " +
      "a comunicarlo de forma inmediata.",
    datos:
      "LOPDGDD (Ley Orgánica 3/2018), art. 7 — a partir de los 14 años el menor consiente por " +
      "sí mismo el tratamiento de sus datos; por debajo, consiente quien tiene la patria potestad.",
  },
  AR: {
    grooming: "Ley 26.904 (2013) — art. 131 del Código Penal: 6 meses a 4 años.",
    proteccion: "Ley 27.590 «Mica Ortega» (2020) — Programa Nacional de Prevención.",
    datos:
      "Ley 25.326 de Protección de los Datos Personales, art. 7 — queda prohibida la formación " +
      "de archivos que revelen, directa o indirectamente, datos sensibles.",
  },
};

export function marcoLegalDe(pais: Pais = PAIS_POR_DEFECTO): MarcoLegal {
  return MARCO_LEGAL_POR_PAIS[pais];
}
