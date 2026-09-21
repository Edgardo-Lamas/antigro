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
 * ⬜ **España está vacío todavía**, y el prompt lo dice en voz alta en vez de
 * disimularlo (ver `recomendacionesParaElPrompt`). Faltan traer, textuales y
 * con enlace: **INCIBE / IS4K**, **ANAR** y **Save the Children España**.
 */
export const FUENTES_POR_PAIS: Record<Pais, Fuente[]> = {
  ES: [],
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
