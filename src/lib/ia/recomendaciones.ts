/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LO QUE RECOMIENDAN LOS ORGANISMOS OFICIALES — verificado el 2026-08-19
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Existe por un desbalance que apareció leyendo respuestas reales:** las
 *  CIFRAS del asistente estaban todas citadas, y los CONSEJOS no. Cuando decía
 *  *"entrá por lo de afuera"* o *"no digas «no hables con desconocidos»"*, eso
 *  no salía de ninguna fuente: era conocimiento general del modelo con la voz de
 *  AntiGro puesta encima. Y es la parte **más accionable** de todo lo que dice.
 *
 *  **Lo levantó Edgardo el 19/8:** *"esas respuestas deberían estar validadas
 *  por gente con experiencia como la que debe haber en la Asociación Argentina
 *  de Grooming o entes similares"*. Tiene razón, y esto es el primer paso
 *  verificable mientras consigue esa validación.
 *
 *  🔑 **Es la misma disciplina que ya tiene el cuestionario**, trasladada: allá
 *  cada pregunta declara si viene de un estudio, de un organismo o es un hecho
 *  observable. Acá cada consejo dice **quién lo dice**, con su enlace y su
 *  fecha de verificación.
 *
 *  ⚠ **Esto NO reemplaza la validación profesional que él va a buscar.** Son
 *  recomendaciones publicadas por organismos del Estado, no una revisión por
 *  especialistas de nuestro material. Cuando llegue esa revisión, entra acá.
 */

/* ⚠ Ruta relativa con `.ts`, no el alias `@/`: `consejos.prueba.ts` corre con
   node pelado y ahí el alias de TypeScript no existe. Mismo motivo por el que el
   motor se cambió el 21/9 — un archivo que no se puede cargar sin levantar Next
   es un archivo que no se puede probar. */
import { NOMBRE_DEL_PAIS, PAIS_POR_DEFECTO, type Pais } from "../paises.ts";

export type Momento =
  /** Antes de que pase nada. Es donde vive la regla 4. */
  | "prevencion"
  /** El chico contó algo. Los primeros minutos deciden si vuelve a contar. */
  | "si_el_chico_cuenta"
  /** Ya pasó. Acá se pierden pruebas por hacer lo intuitivo. */
  | "si_ya_paso";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HASTA DÓNDE LLEGA UN CONSEJO — lo levantó Edgardo el 2026-09-21
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Su planteo:** *"un buen consejo de Argentina debería ser bueno también para
 * los españoles, y viceversa"*. **Tenía razón, y el error era mío:** yo había
 * estirado a todo consejo una regla que este archivo escribió para los teléfonos
 * y los recursos. Son tres capas distintas y sólo una es local:
 *
 * | Capa | ¿Viaja? |
 * |---|---|
 * | **El contenido** —«no borres nada, es la prueba»— | ✅ Sí. Medido: 27 de 28 |
 * | **Quién lo firma** | 🟡 Viaja, pero pesa distinto. Se dice de dónde sale |
 * | **El canal y el órgano** —«la fiscalía más cercana»— | ❌ Nunca |
 *
 * 🔑 **Y cuando dos países coinciden en un consejo universal, eso es validación
 * cruzada:** dos Estados independientes diciendo lo mismo vale más que
 * cualquiera de los dos solo.
 */
export type Alcance =
  /**
   * El criterio vale en cualquier país. Se le puede ofrecer a quien sea,
   * **diciendo de qué organismo sale.**
   * 🔴 Una recomendación universal NO puede nombrar un teléfono, una ley, un
   * órgano ni un trámite. Hay una comprobación que lo verifica.
   */
  | "universal"
  /**
   * Nombra un órgano, un procedimiento, un plazo o un número. **No sale nunca
   * fuera de su país**, y no por prolijidad: mandar a alguien de Madrid a «la
   * fiscalía más cercana» es mandarlo a un lugar que no existe con ese nombre.
   */
  | "del_pais";

export interface Recomendacion {
  momento: Momento;
  /**
   * 🔴 **Obligatorio a propósito, sin valor por defecto.** Un defecto en
   * `universal` haría viajar sin querer el primer consejo que traiga un teléfono
   * adentro; uno en `del_pais` dejaría mudo a un país por olvido. Que TypeScript
   * obligue a decidirlo es la única forma de que nadie lo saltee.
   */
  alcance: Alcance;
  /** 🔴 TEXTUAL de la fuente. Si hay que acortarlo, se acorta sin reescribir. */
  texto: string;
  /** Por qué importa, cuando no es obvio. Nuestro, y se nota que es nuestro. */
  porQue?: string;
}

export interface Fuente {
  organismo: string;
  enlace: string;
  verificado: string;
  recomendaciones: Recomendacion[];
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  POR PAÍS desde el 19/9 — y acá está el motivo entero de la capa
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 **Esto es lo que salvó Edgardo.** Yo venía a reemplazar estas fuentes
 * argentinas por las españolas, o sea a borrarlas. Él preguntó por qué no
 * quedaban las dos y elegía el agente según el país. El material está
 * verificado y no está mal: está en otro país.
 *
 * 🔴 **Un consejo respaldado por un organismo del Estado vale distinto que una
 * opinión bien escrita — pero sólo si es el Estado de quien lo lee.** Citarle
 * el Ministerio de Justicia argentino a un padre de Sevilla no es un problema
 * de localización: es citar una autoridad que ahí no lo es.
 *
 * ✅ **España dejó de estar vacío el 21/9**: entraron INCIBE (IS4K) y la
 * Fundación ANAR, textuales y con enlace, verificados ese día en fuente.
 *
 * 📌 **Save the Children España quedó afuera, y no por olvido.** Su informe
 * *«Tras la pantalla»* (enero 2026) es una fuente excelente de CIFRAS —y como
 * tal ya se usa—, pero sus recomendaciones son de política pública
 * (especialización judicial, modelo Barnahus), no pautas para un adulto que
 * está mirando el teléfono de su hijo. Meterlas acá sería darle a un padre un
 * consejo que no puede ejecutar.
 */
export const FUENTES_POR_PAIS: Record<Pais, Fuente[]> = {
  ES: [
  {
    organismo:
      "INCIBE / Internet Segura For Kids (IS4K) — «Decálogo de mediación parental y educación digital para familias»",
    enlace: "https://www.incibe.es/menores/familias/decalogo-mediacion-parental-familias",
    verificado: "2026-09-21",
    recomendaciones: [
      /* ── Prevención ── */
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "La clave para una educación digital responsable es la comunicación. Habla regularmente " +
          "con tus hijos/as sobre lo que hacen en línea, lo que les gusta y lo que les preocupa.",
        porQue:
          "🔑 Coincide con lo que dice el Ministerio de Justicia argentino, y esa coincidencia vale: " +
          "son dos Estados independientes que llegaron a lo mismo por su cuenta.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Acuerda, junto a tus hijos/as, las reglas sobre el uso de dispositivos digitales, los " +
          "horarios de uso y el tipo de contenido al que pueden acceder. Involúcralos en la " +
          "creación de estos pactos para fomentar su compromiso y responsabilidad.",
        porQue:
          "El acuerdo con el chico adentro es lo contrario de la norma impuesta: la que se impone " +
          "se rompe a escondidas, y lo que se hace a escondidas no se cuenta.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Participa activamente en la vida digital de tus hijos/as. Pasar tiempo juntos en línea " +
          "permite comprender mejor sus actividades, intereses y las personas con las que " +
          "interactúan. Anímalos a mostrarte lo que hacen en línea para aprender juntos y " +
          "conversar sin prejuicios.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Enséñales la importancia de proteger su información personal y a gestionar su privacidad " +
          "en redes sociales, aplicaciones y plataformas en línea. Explícales qué datos no deben " +
          "compartir y por qué.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Fomenta el pensamiento crítico. Ayúdales a cuestionar lo que ven en Internet y a " +
          "verificar la información antes de compartirla.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Supervisar el uso de Internet es importante, pero también lo es respetar la autonomía de " +
          "tus hijos conforme van creciendo y madurando. Evita prejuzgar, confía en su criterio y " +
          "acompáñalos en su camino digital, permitiéndoles descubrir el mundo.",
        porQue:
          "🔑 Es la misma línea que sostiene este producto: acompañar no es vigilar, e informar no " +
          "es bloquear.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Los padres y las madres son los principales modelos a seguir, recuerda que los hijos/as " +
          "aprenden observando. Practica una conducta digital responsable para que los menores " +
          "puedan aprender observando tu comportamiento. Tu ejemplo es su mejor guía.",
      },
      /* ── Si ya pasó ── */
      {
        momento: "si_ya_paso",
        alcance: "del_pais",
        texto:
          "Recuerda que tu tranquilidad y la de los/las menores en el mundo digital tiene un número " +
          "de teléfono: 017. La línea está atendida por un equipo multidisciplinar de expertos que " +
          "te darán asesoramiento según la temática de tu consulta. Además, es gratuito, " +
          "confidencial y está disponible para toda la familia los 365 días del año.",
      },
    ],
  },
  {
    organismo:
      "Fundación ANAR — «Decálogo ANAR sobre cómo actuar si un menor de edad está en situación de riesgo»",
    enlace:
      "https://www.anar.org/soluciones-anar/consejos/decalogo-anar-sobre-como-actuar-si-un-menor-de-edad-esta-en-situacion-de-riesgo/",
    verificado: "2026-09-21",
    recomendaciones: [
      /* ── Si el chico cuenta ── */
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto:
          "No esperes. Las primeras horas pueden ser decisivas para salvar la vida de un niño/a o " +
          "evitar la exposición a una nueva situación de maltrato.",
        porQue:
          "🔴 Es lo que contesta la duda más común del adulto que acaba de enterarse: «¿espero a " +
          "ver si sigue?». La fuente dice que no, y lo dice desde 5 millones de llamadas atendidas.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto:
          "Ponte en su piel. Piensa que si tú eres adulto y tienes miedo a intervenir por las " +
          "posibles represalias, imagínate cómo se puede sentir un niño/a, que es mucho más " +
          "vulnerable.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "del_pais",
        texto:
          "Si conoces o sospechas de alguna situación en la que un menor de edad puede estar en " +
          "desamparo, riesgo o emergencia, tu colaboración es fundamental. Llama al Teléfono ANAR " +
          "o escribe al Chat ANAR. Son totalmente anónimos y confidenciales y están atendidos por " +
          "un equipo de profesionales (orientadores psicólogos, apoyados por abogados y " +
          "trabajadores sociales) especializados en infancia.",
      },
      /* ── Si ya pasó ── */
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto:
          "Recuerda que cada caso es único. Describe lo mejor que puedas la situación que padece " +
          "el menor de edad. Esta información es determinante para identificar la emergencia y el " +
          "riesgo concreto.",
      },
      {
        momento: "si_ya_paso",
        alcance: "del_pais",
        texto:
          "Recaba información. Es necesario que puedas recoger toda aquella información que nos " +
          "permita identificar el riesgo real en el que se encuentra el menor de edad y, llegado " +
          "el caso, poder trasladarlo a los organismos competentes y que actúen cuanto antes.",
        porQue:
          "📌 Va como del país porque el «nos» es ANAR. El criterio de fondo —guardar lo que hay " +
          "antes de tocar nada— ya viaja en las recomendaciones universales del catálogo argentino.",
      },
      {
        momento: "si_ya_paso",
        alcance: "del_pais",
        texto:
          "Si observas que la integridad física del menor de edad está en peligro inminente, llama " +
          "de forma urgente a las Fuerzas y Cuerpos de Seguridad, Policías Autonómicas o al 112.",
      },
      {
        momento: "si_ya_paso",
        alcance: "del_pais",
        texto:
          "Ten en cuenta que todo adulto conocedor de una situación de riesgo a un menor de edad " +
          "está obligado por ley a dar traslado a las autoridades competentes, además de prestar " +
          "auxilio inmediato.",
      },
    ],
  },
  ],
  AR: [
  {
    organismo:
      "Ministerio de Justicia de la Nación — «Guía para padres, familias y docentes» (Con Vos en la Web)",
    enlace:
      "https://www.argentina.gob.ar/justicia/convosenlaweb/situaciones/guia-para-padres-familias-y-docentes-grooming",
    verificado: "2026-08-19",
    recomendaciones: [
      /* ── Prevención ── */
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "No les prohíbas que tengan amigos virtuales. Dales herramientas para que reconozcan " +
          "a sus verdaderos amigos.",
        porQue:
          "🔑 Es más fino que «no hables con desconocidos»: prohibir no saca al desconocido, " +
          "saca al chico de la conversación. El 60,0% ya habla por internet con desconocidos " +
          "(Informe Grooming LATAM), así que la prohibición sólo le enseña a no contarlo.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Reforzá que, más allá de la confianza y la amistad que se haya generado, las " +
          "personas desconocidas siguen siendo desconocidas.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Respetá la privacidad de los niños y adolescentes. Por ejemplo, no ingreses a " +
          "escondidas a sus cuentas.",
        porQue:
          "🔴 Es el Ministerio diciendo lo mismo que las reglas 2 y 3 de AntiGro. No es una " +
          "postura nuestra: es lo que recomienda el organismo.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto:
          "Acompañá la vida online de tus hijos. Conocé las páginas o redes sociales visitadas " +
          "frecuentemente.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Explicales con franqueza sobre estas medidas para concientizarlos.",
        porQue: "🔑 Con franqueza, no a escondidas. Es la regla 3 otra vez, dicha por ellos.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Evitá compartir fotos de tus hijos con el uniforme del colegio.",
        porQue: "El uniforme dice a qué colegio va y en qué barrio está.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Enseñales a no hacer videoconferencias con desconocidos.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Da el ejemplo. Usá con responsabilidad tus propias redes sociales.",
      },

      /* ── Si el chico cuenta ── */
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto: "Si el niño te cuenta algo, escuchalo con atención.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto:
          "No lo avergüences ni lo culpes, así se sentirá confiado para revelar lo sucedido.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto: "Evitá interrogarlo.",
        porQue:
          "🔴 Es lo que un padre asustado hace primero, y es lo que cierra la puerta. El " +
          "organismo lo pone como una indicación, no como un matiz.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto: "Acompañalo con afecto. Es importante que sepa que no está solo.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto:
          "Comprendé que sufría un estado de amenaza o chantaje que lo llevó a responder los " +
          "mensajes.",
        porQue:
          "🔑 Explica por qué el chico «siguió hablándole». No fue voluntad: fue coerción.",
      },
      {
        momento: "si_el_chico_cuenta",
        alcance: "universal",
        texto: "Buscá apoyo profesional para darle herramientas y contención emocional.",
      },

      /* ── Si ya pasó ── */
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto: "No borres contenido de la computadora, tableta o teléfono celular.",
        porQue:
          "🔴 Es lo primero que hace un padre —borrar lo que le duele— y destruye la prueba.",
      },
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto:
          "Guardá las conversaciones, las imágenes y los videos. Hacé capturas de pantalla y " +
          "guardalas en formato digital o impreso.",
      },
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto: "No amenaces directamente al acosador para que no se aleje.",
        porQue:
          "🔴 Va contra el instinto por completo, y por eso hay que decirlo: si se asusta, " +
          "borra todo y desaparece, y con él la posibilidad de identificarlo.",
      },
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto: "Reportá el perfil en la plataforma digital por conducta inapropiada.",
      },
      {
        momento: "si_ya_paso",
        /* 🔴 La ÚNICA de las 28 que no viaja: «fiscalía o comisaría» son órganos
           del sistema argentino. En España el camino es Policía Nacional,
           Guardia Civil o el juzgado de guardia, y el canal prioritario de la
           AEPD para la retirada urgente. El criterio —denunciar— es universal;
           el nombre del lugar no. */
        alcance: "del_pais",
        texto: "Denunciá al acosador en la fiscalía o comisaría más cercana.",
      },
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto:
          "Evitá divulgar el caso en redes sociales. La protección de la identidad del niño es clave.",
      },
      {
        momento: "si_ya_paso",
        alcance: "universal",
        texto: "Pedí asesoramiento legal.",
      },
    ],
  },
  {
    organismo:
      "Ministerio Público de la Provincia de Buenos Aires — Procuración General de la SCBA",
    enlace: "https://www.mpba.gov.ar/grooming",
    verificado: "2026-08-19",
    recomendaciones: [
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Acompañalos sin invadir ni prohibir el uso.",
        porQue: "🔑 Las tres cosas en una línea, y es la que mejor resume el criterio entero.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Preguntar con quiénes hablan en Internet.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Procurar que se conecten a Internet en lugares comunes de la casa.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Dialogar e informarles acerca de los riesgos existentes.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Explicarles la diferencia entre lo público y lo privado.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Prestar atención a los cambios repentinos de humor.",
        porQue: "📌 Es la misma recomendación que respalda dos preguntas del cuestionario.",
      },
      {
        momento: "prevencion",
        alcance: "universal",
        texto: "Observar posibles cambios en los horarios de conexión.",
        porQue:
          "📌 Es lo único que respalda institucionalmente que el sistema mire el horario. " +
          "⚠ No dice POR QUÉ, y por eso AntiGro tampoco lo afirma.",
      },
    ],
  },
  ],
};

export function fuentesDe(pais: Pais): Fuente[] {
  return FUENTES_POR_PAIS[pais];
}

const NOMBRE_DEL_MOMENTO: Record<Momento, string> = {
  prevencion: "ANTES DE QUE PASE NADA",
  si_el_chico_cuenta: "SI EL CHICO CUENTA ALGO",
  si_ya_paso: "SI YA PASÓ",
};

/**
 * El bloque que va adentro del prompt estable.
 *
 * 🔑 Se arma de `FUENTES` en vez de estar escrito a mano: agregar una
 * recomendación la hace aparecer sola, y nadie puede meter un consejo en el
 * prompt sin decir de dónde salió — que es todo el punto de este archivo.
 */
export function recomendacionesParaElPrompt(pais: Pais = PAIS_POR_DEFECTO): string {
  const propias = fuentesDe(pais);

  /**
   * 🔑 **Lo prestado: el criterio universal de los otros países.**
   *
   * Hasta el 21/9 un país sin organismos cargados se quedaba mudo, y España
   * estaba exactamente así. Lo volteó Edgardo: *"un buen consejo de Argentina
   * debería ser bueno también para los españoles"*. **Y es verdad en 27 de las
   * 28** — «no borres nada», «no lo interrogues», «no amenaces al acosador» no
   * dependen de ninguna jurisdicción.
   *
   * 🔴 **Lo que NO se presta es lo marcado `del_pais`**, y ahí está la regla
   * dura de la capa de país intacta: un órgano o un teléfono equivocado, dado
   * en el peor momento, no falla ruidosamente — falla en silencio, y del otro
   * lado hay alguien esperando que alguien atienda.
   */
  const prestadas = (Object.keys(FUENTES_POR_PAIS) as Pais[])
    .filter((otro) => otro !== pais)
    .flatMap((otro) =>
      FUENTES_POR_PAIS[otro].map((f) => ({
        organismo: f.organismo,
        desde: NOMBRE_DEL_PAIS[otro],
        recomendaciones: f.recomendaciones.filter((r) => r.alcance === "universal"),
      })),
    )
    .filter((f) => f.recomendaciones.length > 0);

  if (propias.length === 0 && prestadas.length === 0) {
    return (
      `⚠ Para ${NOMBRE_DEL_PAIS[pais]} todavía no hay recomendaciones de organismos oficiales ` +
      `cargadas en el sistema.\n` +
      `🔴 Podés ordenar opciones y proponer una forma de empezar —es parte de tu trabajo—, pero ` +
      `NO presentes ningún consejo como respaldado por un organismo. Si te preguntan de dónde ` +
      `sale lo que decís, decí que es criterio del sistema y no una recomendación oficial.`
    );
  }

  const bloques: string[] = [];

  for (const momento of ["prevencion", "si_el_chico_cuenta", "si_ya_paso"] as Momento[]) {
    const lineas: string[] = [];

    for (const fuente of propias) {
      for (const r of fuente.recomendaciones.filter((x) => x.momento === momento)) {
        lineas.push(`- "${r.texto}" (${fuente.organismo})`);
      }
    }
    for (const fuente of prestadas) {
      for (const r of fuente.recomendaciones.filter((x) => x.momento === momento)) {
        lineas.push(`- "${r.texto}" (${fuente.organismo} — ${fuente.desde})`);
      }
    }

    if (lineas.length > 0) {
      bloques.push([`── ${NOMBRE_DEL_MOMENTO[momento]} ──`, ...lineas].join("\n"));
    }
  }

  /**
   * 🔴 **La instrucción va SIEMPRE que haya prestadas, y es la que impide el
   * único error grave posible acá:** que el modelo le presente a un padre de
   * Sevilla un organismo argentino como si fuera su autoridad. El criterio se
   * puede ofrecer; la autoridad no se puede inventar.
   */
  if (prestadas.length > 0) {
    const deOtroPais = [...new Set(prestadas.map((f) => f.desde))].join(" y ");
    bloques.push(
      `🔴 ATENCIÓN AL CITAR — algunas de las recomendaciones de arriba llevan el país al lado ` +
        `del organismo (${deOtroPais}), y ${propias.length === 0 ? "son todas las que hay" : "no son del país de quien te lee"}.\n` +
        `- El CRITERIO se puede usar: no depende de la legislación de ningún país.\n` +
        `- Pero el TEXTO es una cita y está escrito como se habla en su país: usá la idea con tus ` +
        `palabras y en el registro de quien te lee. No la copies literal.\n` +
        `- Pero NUNCA las presentes como la autoridad de quien te lee. Si nombrás el organismo, ` +
        `decí de dónde es: «el Ministerio de Justicia de Argentina lo recomienda así».\n` +
        `- Y NO derives a ningún teléfono, fiscalía, comisaría ni trámite que salga de ahí: ` +
        `para eso usá únicamente los recursos del país que ya tenés cargados.`,
    );
  }

  return bloques.join("\n\n");
}

/** Para mostrarlas en pantalla con su enlace, sin repetir la lista. */
export function organismosCitados(
  pais: Pais = PAIS_POR_DEFECTO,
): { organismo: string; enlace: string; verificado: string }[] {
  return fuentesDe(pais).map((f) => ({
    organismo: f.organismo,
    enlace: f.enlace,
    verificado: f.verificado,
  }));
}
