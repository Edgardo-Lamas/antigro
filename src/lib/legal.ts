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
    id: "ley-26061-10",
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
    id: "ley-25326-2",
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
    id: "ley-25326-7",
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
    id: "ccyc-641",
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
    id: "ccyc-654",
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
    id: "ley-24240-37",
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
