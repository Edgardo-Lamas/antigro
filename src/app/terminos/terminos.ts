/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS TÉRMINOS DE USO — escritos el 18/8, pedidos por Edgardo
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La razón por la que existen no es la que uno supone, y conviene que
 *  quede escrita acá arriba para que nadie los reescriba al revés.**
 *
 *  Edgardo los propuso pensando en cobertura: *"si lo aceptan nos daría
 *  cobertura"*. La intuición es buena y el instrumento también, pero la
 *  cobertura NO viene de una cláusula que nos exima. El art. 37 de la Ley
 *  24.240 tiene **por no convenidas** las cláusulas que limitan la
 *  responsabilidad por daños: se escriben, el usuario las acepta, y un juez las
 *  tacha dejando el contrato en pie sin ellas. Y los derechos de un chico no
 *  los renuncia su padre tildando una casilla.
 *
 *  🔑 **Lo que sí protege, y es de lo que están hechos estos términos:**
 *
 *  1. **Describir con precisión qué hace el sistema y qué no.** Eso ya está
 *     construido —no se lee un solo mensaje, no se nombra a nadie como
 *     acosador—; acá queda por escrito y con la ley al lado.
 *  2. **Las declaraciones de quien se da de alta.** «Declaro que ejerzo la
 *     responsabilidad parental sobre este chico» no es una exención nuestra: es
 *     un hecho que declara él. Si mintió, la responsabilidad se mueve hacia
 *     quien mintió. Es lo único de un contrato de adhesión que de verdad cubre.
 *  3. **El registro de quién accedió.** Una constancia vale más que una
 *     cláusula.
 *
 *  ⚠ **Y el límite, dicho adentro del propio documento:** esto lo escribió un
 *  sistema de software, no un abogado. Alcanza para el CoderCup. El día que
 *  haya una suscripción paga, hay una relación de consumo y esto lo tiene que
 *  mirar un profesional.
 *
 *  📌 Aparte del componente por lo mismo que los carteles del tour: es
 *  contenido, se corrige sin abrir la pantalla, y así tiene su tanda de pruebas
 *  —las tandas corren con node pelado, que no lee `.tsx`.
 */

/**
 * 🔴 **Cambia cuando cambia el texto, no cuando cambia el código.** Si alguien
 * aceptó la versión de agosto y después el documento dice otra cosa, hay que
 * poder saber qué aceptó. Cuando el registro de aceptaciones exista, guarda
 * esta cadena junto con la fecha.
 */
export const VERSION = "2026-08-18";

/** Tope de largo de cada párrafo. Ver la comprobación en `terminos.prueba.ts`. */
export const LARGO_MAXIMO_PARRAFO = 400;

export interface SeccionDeTerminos {
  id: string;
  titulo: string;
  /** Una sola frase. Es lo que se lleva el que no lee el resto. */
  bajada: string;
  parrafos: string[];
  /**
   * 🔑 **Lo que declara quien acepta**, separado a propósito de lo que decimos
   * nosotros. Son hechos que afirma el usuario, y son la única parte del
   * documento que le traslada algo. Por eso se muestran distinto en pantalla:
   * mezclarlos con el resto los volvería letra chica.
   */
  declaraciones?: string[];
  /** `id` de `NORMAS` en `src/lib/legal.ts`. */
  normas?: string[];
}

/**
 * 🔴 **El orden es el de la guía y no es casual:** primero qué es y qué no es,
 * después qué se mira y qué no se mira nunca, y recién entonces lo que se le
 * pide a la familia. Empezar por las obligaciones del usuario es lo que hace
 * que nadie lea unos términos.
 */
export const SECCIONES: SeccionDeTerminos[] = [
  {
    id: "que-es",
    titulo: "Qué es AntiGro, y qué no es",
    bajada: "Un sistema que percibe señales y le habla a un adulto. Nada más que eso.",
    parrafos: [
      "AntiGro observa señales indirectas de la actividad en internet de un chico —a qué hora se " +
        "conecta, cuántos sitios distintos aparecen, si aparecen sitios nuevos— y, cuando ese " +
        "patrón se sostiene en el tiempo, le avisa a los adultos responsables.",
      "No es un detector de grooming. No dice, ni puede decir, que un chico esté siendo acosado " +
        "ni que alguien sea un acosador. Lo que entrega es una lectura del sistema con el motivo " +
        "a la vista, para que un adulto mire y decida.",
      "No reemplaza a la Línea 137, ni a una denuncia, ni a un profesional. Si algo hace ruido, " +
        "el camino es ése y el sistema lo dice cada vez que corresponde.",
      "Lo que muestra AntiGro no es prueba judicial y no está preparado para serlo.",
    ],
  },
  {
    id: "datos",
    titulo: "Qué se mira, y qué no se mira nunca",
    bajada: "Nombres de sitios y horarios. El contenido de los mensajes no pasa por acá.",
    parrafos: [
      "El sistema ve qué sitios consultó el aparato del chico y a qué hora. No ve, no guarda y no " +
        "puede leer el contenido de los mensajes, ni las fotos, ni las llamadas. No es una " +
        "decisión que podamos cambiar de opinión mañana: por donde pasa esa información, el " +
        "contenido no viaja.",
      "El sistema tampoco guarda ninguna afirmación sobre la salud ni sobre la vida sexual de un " +
        "chico. La ley prohíbe formar archivos que revelen datos sensibles, directa o " +
        "indirectamente, y una anotación del tipo «este chico está siendo víctima de un delito " +
        "sexual» sería exactamente eso. Por eso el sistema habla de señales que merecen la " +
        "atención de un adulto, y nunca de un diagnóstico.",
      "Los datos que sí se guardan son los que cargó la familia —el nombre y la edad del chico, " +
        "quiénes son los adultos— y lo que el sistema fue observando y respondiendo.",
    ],
    normas: ["ley-26061-10", "ley-25326-2", "ley-25326-7"],
  },
  {
    id: "quien-da-de-alta",
    titulo: "Quién puede dar de alta a un chico",
    bajada: "Sólo quien tiene responsabilidad parental o tutela sobre él. Y lo declara.",
    parrafos: [
      "Poner a un chico en un sistema que observa su actividad es una decisión de quien lo tiene " +
        "a cargo, no de cualquiera que conozca su nombre. Por eso el alta pide una declaración, " +
        "y esa declaración queda guardada con la fecha.",
      "El vínculo puede ser el de madre o padre, o el de quien ejerce la tutela: una abuela, un " +
        "tío, quien esté a cargo del día a día. El sistema no supone que una familia tenga una " +
        "sola forma.",
      "AntiGro no puede comprobar esa declaración y no finge que sí. Lo que hace es dejar " +
        "constancia de quién la hizo y cuándo.",
    ],
    declaraciones: [
      "Que ejerzo la responsabilidad parental o la tutela sobre el chico que voy a dar de alta.",
      "Que los datos que cargo son verdaderos, y que si dejo de estar a cargo lo voy a dar de baja.",
      "Que entiendo que AntiGro no detecta delitos ni reemplaza a la Línea 137.",
    ],
  },
  {
    id: "el-otro-progenitor",
    titulo: "Cuando los padres no viven juntos",
    bajada: "Cada casa tiene su propia entrada, y la que se abre no la cierra el otro.",
    parrafos: [
      "El panel es uno solo y muestra lo mismo para los dos: no hay una versión para cada casa. " +
        "Lo que se duplica es la entrada, para que ninguno dependa de que el otro le pase una " +
        "clave.",
      "Quien da de alta al chico decide si abre la segunda entrada. Pero una vez abierta, no la " +
        "puede cerrar: es de la otra casa. Está hecho así a propósito, para que el acceso a cómo " +
        "está un hijo no se pueda usar como moneda de cambio en una pelea entre adultos.",
      "El motivo no es nuestro. La ley dice que, aun separados, el ejercicio de la " +
        "responsabilidad parental es de ambos, y que cada progenitor debe informar al otro sobre " +
        "las cuestiones relativas a la persona del hijo.",
      "Si existe una decisión judicial que diga otra cosa —una restricción, o el ejercicio " +
        "atribuido a uno solo—, esa decisión manda por encima de lo que se configure acá. " +
        "AntiGro no pide sentencias ni las puede verificar: es responsabilidad de quien usa el " +
        "sistema respetarla.",
    ],
    declaraciones: [
      "Que si hay una medida judicial sobre el cuidado del chico, la voy a respetar al decidir " +
        "quién entra.",
    ],
    normas: ["ccyc-641", "ccyc-654"],
  },
  {
    id: "registro",
    titulo: "Qué queda registrado",
    bajada: "Desde qué casa se entró es un hecho. Quién de las personas, es lo que se declaró.",
    parrafos: [
      "El sistema deja constancia de las acciones que importan: cuándo se contestó el " +
        "cuestionario, cuándo se leyó un aviso, cuándo se dio de alta o de baja a un adulto.",
      "La clave es de la casa, no de una persona. Entonces el sistema sabe con certeza desde qué " +
        "casa se entró, y no sabe quién de sus adultos la usó. Cuando se pregunta quién está " +
        "contestando, la respuesta se guarda como lo que es: una declaración, no una " +
        "comprobación. En pantalla se muestra así, y no como si el sistema lo hubiera verificado.",
      "Ese registro lo ven los adultos que entran al panel, incluidos los de la otra casa. Es a " +
        "propósito: sirve para que los dos sepan qué se hizo, y para que después nadie discuta si " +
        "la información estuvo disponible.",
    ],
  },
  {
    id: "la-familia",
    titulo: "Lo que le toca a la familia",
    bajada: "Hablar con el chico. El sistema no lo puede hacer por ustedes, y no simula que pasó.",
    parrafos: [
      "AntiGro parte de que el chico sabe que el sistema existe. No es un espía instalado a " +
        "escondidas, y usarlo como si lo fuera lo convierte en otra cosa, peor y contra la ley: " +
        "un chico tiene derecho a su vida privada.",
      "Por eso el alta incluye una pantalla sobre cómo contarle. El sistema no tiene forma de " +
        "comprobar que esa conversación ocurrió, así que no pide tildar nada ni finge que pasó.",
      "También le toca a la familia mantener los datos al día —quiénes son los adultos, cuál es " +
        "el aparato del chico— y avisar cuando algo cambia. El sistema trabaja con lo que le " +
        "cargaron.",
    ],
    declaraciones: [
      "Que el chico va a saber que AntiGro está funcionando, en los términos que su edad permita.",
    ],
    normas: ["ley-26061-10"],
  },
  {
    id: "baja",
    titulo: "Cómo se sale, y qué pasa con los datos",
    bajada: "Se puede dar de baja en cualquier momento, y los datos del chico se borran.",
    parrafos: [
      "El consentimiento que se dio acá se puede revocar cuando se quiera. Al dar de baja a la " +
        "familia, se borran los datos del chico y todo lo que el sistema observó sobre él.",
      "Un adulto que se da de baja no se borra: queda marcado como dado de baja, con el motivo. " +
        "Que una persona haya estado a cargo es parte de la historia de esa familia, y borrarlo " +
        "cambiaría lecturas que ya se hicieron.",
      "Cualquiera puede pedir ver, corregir o borrar sus datos. Es un derecho que da la ley de " +
        "protección de datos personales, no una concesión nuestra.",
    ],
    normas: ["ley-25326-2"],
  },
  {
    id: "limites",
    titulo: "Los límites de este documento",
    bajada: "Está escrito para que se entienda, no para escondernos atrás.",
    parrafos: [
      "En estos términos no vas a encontrar una cláusula que diga que no nos hacemos cargo de " +
        "nada. No está por olvido: la ley de defensa del consumidor tiene por no convenidas las " +
        "cláusulas que limitan la responsabilidad por daños, así que escribirla no protegería a " +
        "nadie y sólo serviría para que este documento fuera más difícil de leer.",
      "Lo que sí hacemos es describir con precisión qué hace el sistema y qué no. Ésa es la " +
        "medida de lo que se puede esperar de AntiGro.",
      "Hoy AntiGro no cobra nada. Este documento se escribió para una versión de demostración. " +
        "Cuando exista una suscripción paga habrá una relación de consumo, y estos términos " +
        "tienen que ser revisados por un profesional antes de eso.",
      "Este texto no es asesoramiento legal. Las normas que se citan están enlazadas a su fuente " +
        "para que cualquiera las lea completas.",
    ],
    normas: ["ley-24240-37"],
  },
];
