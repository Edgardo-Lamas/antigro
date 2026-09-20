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
import type { Pais } from "@/lib/paises";

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
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LAS NORMAS, PAÍS POR PAÍS — así desde el 19/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 **El `id` dejó de ser la norma y pasó a ser el CONCEPTO.** Antes se
 * llamaba `ley-26061-10`; ahora se llama `intimidad-del-menor`, y cada país
 * trae la suya para ese mismo concepto. Es lo que permite que los términos de
 * uso se escriban una sola vez: el documento cita «acá va lo de la intimidad
 * del menor» y el país pone el artículo.
 *
 * 🔴 **Los conceptos que citan los términos tienen que existir en TODOS los
 * países.** Lo verifica `terminos.prueba.ts`: un país al que le falte uno no
 * puede habilitarse, porque el documento quedaría citando el aire.
 */
export const NORMAS_POR_PAIS: Record<Pais, NormaCitada[]> = {
  /* ── España — verificado en el BOE y en EUR-Lex el 19/9 ─────────────────── */
  ES: [
  {
    /**
     * 🔑 **Es la que mejor sostiene el producto entero, y es más fuerte que su
     * equivalente argentina.** No dice sólo «intimidad»: dice **secreto de las
     * comunicaciones**, y lo dice de los menores. Un producto que leyera los
     * mensajes de un chico chocaría contra este artículo antes que contra
     * ninguna ley de datos. AntiGro no lee ninguno — y acá está por qué eso no
     * es una limitación técnica, es la forma correcta de hacerlo.
     */
    id: "intimidad-del-menor",
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
    id: "datos-sensibles",
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
    id: "prohibido-archivar-sensibles",
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
    id: "consentimiento-del-menor",
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
    id: "responsabilidad-parental",
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
    id: "deber-de-comunicar",
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
    id: "clausulas-abusivas",
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
  {
    /**
     * 🔑 **El que cubre lo que en Argentina dice el art. 654.** Allá hay un
     * «deber de informar» al otro progenitor escrito con todas las letras; acá
     * no existe ese artículo, y lo que lo sostiene es que la patria potestad es
     * una función que se ejerce **en interés del hijo** y comprende velar por
     * él. 📌 No es lo mismo y no se cita como si lo fuera: por eso el texto va
     * entero y la conclusión la saca quien lea.
     */
    id: "deberes-de-los-padres",
    norma: "Código Civil",
    articulo: "Art. 154",
    titulo: "Qué comprende la patria potestad",
    texto:
      "La patria potestad, como responsabilidad parental, se ejercerá siempre en interés de los " +
      "hijos e hijas, de acuerdo con su personalidad, y con respeto a sus derechos, su integridad " +
      "física y mental. Esta función comprende los siguientes deberes y facultades: 1.º Velar por " +
      "ellos, tenerlos en su compañía, alimentarlos, educarlos y procurarles una formación integral.",
    url: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
    verificado: "2026-09-19",
  },
  ],

  /* ── Argentina — lo que el producto ya tenía, verificado el 18/8 ─────────── */
  AR: [
  {
    id: "intimidad-del-menor",
    norma: "Ley 26.061 — Protección Integral de los Derechos de Niñas, Niños y Adolescentes",
    articulo: "Art. 10",
    titulo: "Derecho a la vida privada e intimidad familiar",
    texto:
      "Las niñas, niños y adolescentes tienen derecho a la vida privada e intimidad de y en la " +
      "vida familiar. Estos derechos no pueden ser objeto de injerencias arbitrarias o ilegales.",
    url: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/110000-114999/110778/norma.htm",
    verificado: "2026-08-18",
  },
  {
    id: "datos-sensibles",
    norma: "Ley 25.326 — Protección de los Datos Personales",
    articulo: "Art. 2",
    titulo: "Qué son datos sensibles",
    texto:
      "Datos sensibles: Datos personales que revelan origen racial y étnico, opiniones políticas, " +
      "convicciones religiosas, filosóficas o morales, afiliación sindical e información " +
      "referente a la salud o a la vida sexual.",
    url: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm",
    verificado: "2026-08-18",
  },
  {
    /**
     * 🔴 **Esta es la que más obliga al diseño, y hay que leerla despacio.**
     * Dice «directa o indirectamente». Un registro que afirmara que un chico
     * está siendo víctima de un delito sexual revelaría, indirectamente, un
     * dato sensible sobre un menor. Por eso el sistema no lo afirma en ningún
     * lado: no es sólo prudencia, es que **formar ese archivo está prohibido**.
     */
    id: "prohibido-archivar-sensibles",
    norma: "Ley 25.326 — Protección de los Datos Personales",
    articulo: "Art. 7, incs. 1 y 3",
    titulo: "Datos sensibles: nadie está obligado, y no se pueden archivar",
    texto:
      "1. Ninguna persona puede ser obligada a proporcionar datos sensibles. […] " +
      "3. Queda prohibida la formación de archivos, bancos o registros que almacenen información " +
      "que directa o indirectamente revele datos sensibles.",
    url: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm",
    verificado: "2026-08-18",
  },
  {
    id: "responsabilidad-parental",
    norma: "Código Civil y Comercial de la Nación",
    articulo: "Art. 641, inc. b",
    titulo: "Ejercicio de la responsabilidad parental cuando los padres no conviven",
    texto:
      "En caso de cese de la convivencia, divorcio o nulidad de matrimonio, a ambos progenitores. " +
      "Se presume que los actos realizados por uno cuentan con la conformidad del otro, con las " +
      "excepciones del artículo siguiente. Por voluntad de los progenitores o por decisión " +
      "judicial, en interés del hijo, el ejercicio se puede atribuir a sólo uno de ellos, o " +
      "establecerse distintas modalidades.",
    url: "https://leyes-ar.com/codigo_civil_y_comercial/641.htm",
    verificado: "2026-08-18",
  },
  {
    /**
     * 🔑 **El artículo que sostiene la segunda puerta.** Que el otro progenitor
     * pueda entrar no es una gentileza del que se dio de alta primero: cómo
     * está el hijo es «cuestión relativa a la persona del hijo», y sobre eso
     * hay un deber de informar que no depende de cómo se lleven entre ellos.
     */
    id: "deberes-de-los-padres",
    norma: "Código Civil y Comercial de la Nación",
    articulo: "Art. 654",
    titulo: "Deber de informar",
    texto:
      "Cada progenitor debe informar al otro sobre cuestiones de educación, salud y otras " +
      "relativas a la persona y bienes del hijo.",
    url: "https://leyes-ar.com/codigo_civil_y_comercial/654.htm",
    verificado: "2026-08-18",
  },
  {
    /**
     * 🔴 **Está acá para que nadie escriba nunca una cláusula que nos exima.**
     * La tentación de un producto que avisa sobre chicos es cubrirse con letra
     * chica; el art. 37 dice que esa letra chica **se tiene por no convenida**.
     * O sea: no protege, y de paso deja al proveedor explicando por qué la
     * escribió. Lo que protege es describir con precisión qué hace el sistema.
     *
     * ⚠ Verificado además que sigue vigente: la Disposición 753/2025 derogó la
     * Resolución 9/2004, que listaba cláusulas abusivas para medicina prepaga,
     * telefonía móvil y servicios financieros. No alcanza a este artículo.
     */
    id: "clausulas-abusivas",
    norma: "Ley 24.240 — Defensa del Consumidor",
    articulo: "Art. 37",
    titulo: "Cláusulas que se tienen por no convenidas",
    texto:
      "Sin perjuicio de la validez del contrato, se tendrán por no convenidas: a) Las cláusulas " +
      "que desnaturalicen las obligaciones o limiten la responsabilidad por daños; b) Las " +
      "cláusulas que importen renuncia o restricción de los derechos del consumidor o amplíen " +
      "los derechos de la otra parte; c) Las cláusulas que contengan cualquier precepto que " +
      "imponga la inversión de la carga de la prueba en perjuicio del consumidor.",
    url: "https://proconsumer.org.ar/art-37/",
    verificado: "2026-08-18",
  },  ],
};

/**
 * 🔴 **El país va siempre explícito, sin valor por defecto.** No es purismo:
 * una norma que se resuelve sola es una norma que alguien va a citar sin saber
 * de qué país la sacó, y estas citas van en un documento que la gente firma.
 */
export function normasDe(pais: Pais): NormaCitada[] {
  return NORMAS_POR_PAIS[pais];
}

/**
 * Busca una norma por `id`.
 *
 * 🔴 **Revienta si no existe, y es a propósito.** Una cita legal que se
 * renderiza vacía es peor que no citar nada: la pantalla queda afirmando algo
 * y el respaldo desaparecido. Que falle en el build es la forma barata de que
 * no llegue así a producción.
 */
export function norma(id: string, pais: Pais): NormaCitada {
  const encontrada = normasDe(pais).find((n) => n.id === id);
  if (!encontrada) {
    throw new Error(`«${pais}» no tiene ninguna norma para el concepto «${id}»`);
  }
  return encontrada;
}
