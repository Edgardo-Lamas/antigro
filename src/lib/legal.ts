/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS NORMAS QUE CITA EL SISTEMA — verificadas en fuente el 18/8
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Cada norma se guarda con su texto TEXTUAL y su enlace.** La regla de la
 *  casa para el dominio vale acá el doble: se cita, no se interpreta. Un
 *  artículo contado de memoria es exactamente el tipo de afirmación que este
 *  producto no se puede permitir, y encima en la parte que un jurado —o un
 *  abogado— va a ir a comprobar.
 *
 *  🔑 **Viven todas en un solo lugar porque las leen tres pantallas distintas**
 *  —los términos, la guía y, cuando haga falta, el asistente—. Si el texto está
 *  escrito tres veces, corregirlo significa acordarse de las tres.
 *
 *  ⚠ `verificado` no es decoración: dice el día en que alguien abrió la fuente
 *  y comparó. Una ley puede cambiar, y de hecho en 2025 se derogó regulación de
 *  cláusulas abusivas (Disposición 753/2025) — no alcanzó al art. 37, pero
 *  cualquiera que vuelva acá tiene que poder saber contra qué fecha mirar.
 *
 *  📌 **Acá no entra jurisprudencia ni doctrina.** Sólo el texto de la norma.
 *  Interpretar qué significa para un caso es el trabajo de un abogado, y este
 *  archivo existe justamente para no meterse en eso.
 */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA VERSIÓN DE LOS TÉRMINOS — se guarda con cada aceptación
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 **Cambia cuando cambia el TEXTO, no cuando cambia el código.** Si alguien
 * aceptó la versión de agosto y en septiembre el documento dice otra cosa, hay
 * que poder saber qué fue lo que aceptó. Una aceptación sin versión es una
 * fecha suelta que no prueba nada.
 *
 * 🔑 **Vive acá y no en `app/terminos/`** porque la lee la ruta que crea la
 * cuenta. Una ruta de API que importa de una pantalla es la clase de enredo que
 * después nadie se anima a tocar.
 */
export const VERSION_DE_LOS_TERMINOS = "2026-09-19";

export interface NormaCitada {
  id: string;
  /** Cómo se la nombra en pantalla. */
  norma: string;
  /** El artículo, tal como se lo cita. */
  articulo: string;
  /** De qué trata, en las palabras del propio código cuando las tiene. */
  titulo: string;
  /** 🔴 Textual. Si hay que resumir, el resumen va en la pantalla, nunca acá. */
  texto: string;
  url: string;
  /** Día en que se abrió la fuente y se comparó. */
  verificado: string;
}

/**
 * 🔑 **El orden no es alfabético: va de lo que protege al chico a lo que nos
 * obliga a nosotros.** Primero por qué el sistema no lee lo que lee, después
 * cómo se reparte entre los padres, y al final lo que le toca al que ofrece el
 * servicio. Es el mismo orden en que lo lee una familia.
 */
export const NORMAS: NormaCitada[] = [
  {
    /**
     * 🔑 **Es la que mejor sostiene el producto entero, y es más fuerte que su
     * equivalente argentina.** No dice sólo «intimidad»: dice **secreto de las
     * comunicaciones**, y lo dice de los menores. Un producto que leyera los
     * mensajes de un chico chocaría contra este artículo antes que contra
     * ninguna ley de datos. AntiGro no lee ninguno — y acá está por qué eso no
     * es una limitación técnica, es la forma correcta de hacerlo.
     */
    id: "lo-1-1996-4",
    norma: "Ley Orgánica 1/1996 de Protección Jurídica del Menor",
    articulo: "Art. 4.1",
    titulo: "Derecho al honor, a la intimidad y a la propia imagen",
    texto:
      "Los menores tienen derecho al honor, a la intimidad personal y familiar y a la propia " +
      "imagen. Este derecho comprende también la inviolabilidad del domicilio familiar y de la " +
      "correspondencia, así como del secreto de las comunicaciones.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-1996-1069",
    verificado: "2026-09-19",
  },
  {
    /**
     * ⚠ La cita va recortada a propósito: el texto oficial en español termina
     * ese párrafo con «las orientación sexuales», una errata del DOUE que no
     * vamos a reproducir en pantalla ni a corregir por nuestra cuenta.
     */
    id: "rgpd-9-1",
    norma: "Reglamento (UE) 2016/679 — RGPD",
    articulo: "Art. 9.1",
    titulo: "Categorías especiales de datos",
    texto:
      "Quedan prohibidos el tratamiento de datos personales que revelen el origen étnico o " +
      "racial, las opiniones políticas, las convicciones religiosas o filosóficas, o la " +
      "afiliación sindical, y el tratamiento de datos genéticos, datos biométricos dirigidos a " +
      "identificar de manera unívoca a una persona física, datos relativos a la salud o datos " +
      "relativos a la vida sexual […].",
    url: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679",
    verificado: "2026-09-19",
  },
  {
    /**
     * 🔴 **Ésta es la que más obliga al diseño, igual que su equivalente
     * argentina, pero por otro camino.** Dice que ni siquiera el consentimiento
     * levanta la prohibición cuando la finalidad principal es identificar la
     * orientación sexual de alguien. Un sistema que afirmara que un menor está
     * siendo víctima de un delito sexual estaría formando exactamente ese dato,
     * y no habría permiso de los padres que lo arreglara. Por eso el sistema no
     * lo afirma en ningún lado: no es prudencia, es que no se puede.
     */
    id: "lopdgdd-9",
    norma: "Ley Orgánica 3/2018 — LOPDGDD",
    articulo: "Art. 9.1",
    titulo: "El consentimiento no basta para los datos más sensibles",
    texto:
      "A los efectos del artículo 9.2.a) del Reglamento (UE) 2016/679, a fin de evitar " +
      "situaciones discriminatorias, el solo consentimiento del afectado no bastará para " +
      "levantar la prohibición del tratamiento de datos cuya finalidad principal sea " +
      "identificar su ideología, afiliación sindical, religión, orientación sexual, creencias " +
      "u origen racial o étnico.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673",
    verificado: "2026-09-19",
  },
  {
    /**
     * 🔑🔑 **Esta norma no existe en Argentina y cambia el producto, no sólo el
     * texto legal: en España, a partir de los 14 el menor consiente por sí
     * mismo el tratamiento de sus datos.** El alta la sigue haciendo el adulto
     * —es su responsabilidad parental—, pero de 14 en adelante el chico deja de
     * ser alguien de quien se habla y pasa a ser alguien a quien hay que
     * preguntarle. 📌 La banda 14-17 del sistema ya cae justo en ese corte, por
     * casualidad: el producto estaba bien preparado sin saberlo.
     */
    id: "lopdgdd-7",
    norma: "Ley Orgánica 3/2018 — LOPDGDD",
    articulo: "Art. 7",
    titulo: "Consentimiento de los menores de edad",
    texto:
      "1. El tratamiento de los datos personales de un menor de edad únicamente podrá fundarse " +
      "en su consentimiento cuando sea mayor de catorce años. […] 2. El tratamiento de los datos " +
      "de los menores de catorce años, fundado en el consentimiento, solo será lícito si consta " +
      "el del titular de la patria potestad o tutela.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673",
    verificado: "2026-09-19",
  },
  {
    /**
     * 🔑 **El artículo que sostiene la segunda puerta.** Que el otro progenitor
     * pueda entrar no es una gentileza del que se dio de alta primero: la patria
     * potestad se ejerce conjuntamente, y dar de alta a un hijo en un sistema
     * que va a avisar sobre él es un acto de esa potestad.
     */
    id: "cc-156",
    norma: "Código Civil",
    articulo: "Art. 156, párrafo primero",
    titulo: "La patria potestad se ejerce conjuntamente",
    texto:
      "La patria potestad se ejercerá conjuntamente por ambos progenitores o por uno solo con el " +
      "consentimiento expreso o tácito del otro. Serán válidos los actos que realice uno de ellos " +
      "conforme al uso social y a las circunstancias o en situaciones de urgente necesidad.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
    verificado: "2026-09-19",
  },
  {
    /**
     * 🔴 **La que le da sentido legal a que el sistema avise, y hay que usarla
     * con cuidado.** En España no comunicar indicios no es una opción personal.
     * 📌 Se cita en los términos, no en el panel: a un padre asustado no se le
     * recuerda su obligación legal, se le da un teléfono.
     */
    id: "lopivi-15",
    norma: "Ley Orgánica 8/2021 de protección integral a la infancia y la adolescencia frente a la violencia",
    articulo: "Art. 15",
    titulo: "Deber de comunicación de la ciudadanía",
    texto:
      "Toda persona que advierta indicios de una situación de violencia ejercida sobre una " +
      "persona menor de edad, está obligada a comunicarlo de forma inmediata a la autoridad " +
      "competente y, si los hechos pudieran ser constitutivos de delito, a las Fuerzas y Cuerpos " +
      "de Seguridad, al Ministerio Fiscal o a la autoridad judicial, sin perjuicio de prestar la " +
      "atención inmediata que la víctima precise.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2021-9347",
    verificado: "2026-09-19",
  },
  {
    /**
     * 🔴 **Está acá para que nadie escriba nunca una cláusula que nos exima.**
     * La tentación de un producto que avisa sobre chicos es cubrirse con letra
     * chica; en España esa letra chica es **nula de pleno derecho**. O sea: no
     * protege, y encima deja al proveedor explicando por qué la escribió. Lo que
     * protege es describir con precisión qué hace el sistema.
     */
    id: "trlgdcu-86",
    norma: "Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios (RDL 1/2007)",
    articulo: "Art. 86",
    titulo: "Cláusulas abusivas por limitar los derechos básicos",
    texto:
      "En cualquier caso serán abusivas las cláusulas que limiten o priven al consumidor y " +
      "usuario de los derechos reconocidos por normas dispositivas o imperativas y, en " +
      "particular, aquellas estipulaciones que prevean: […] 2. La exclusión o limitación de la " +
      "responsabilidad del empresario en el cumplimiento del contrato.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555",
    verificado: "2026-09-19",
  },
];

/**
 * Busca una norma por `id`.
 *
 * 🔴 **Revienta si no existe, y es a propósito.** Una cita legal que se
 * renderiza vacía es peor que no citar nada: la pantalla queda afirmando algo
 * y el respaldo desaparecido. Que falle en el build es la forma barata de que
 * no llegue así a producción.
 */
export function norma(id: string): NormaCitada {
  const encontrada = NORMAS.find((n) => n.id === id);
  if (!encontrada) throw new Error(`No existe la norma citada «${id}»`);
  return encontrada;
}
