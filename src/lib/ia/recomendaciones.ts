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

export type Momento =
  /** Antes de que pase nada. Es donde vive la regla 4. */
  | "prevencion"
  /** El chico contó algo. Los primeros minutos deciden si vuelve a contar. */
  | "si_el_chico_cuenta"
  /** Ya pasó. Acá se pierden pruebas por hacer lo intuitivo. */
  | "si_ya_paso";

export interface Recomendacion {
  momento: Momento;
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

export const FUENTES: Fuente[] = [
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
        texto:
          "No les prohíbas que tengan amigos virtuales. Dales herramientas para que reconozcan " +
          "a sus verdaderos amigos.",
        porQue:
          "🔑 Es más fino que «no hables con desconocidos»: prohibir no saca al desconocido, " +
          "saca al chico de la conversación. El 60% ya habla con desconocidos, así que la " +
          "prohibición sólo le enseña a no contarlo.",
      },
      {
        momento: "prevencion",
        texto:
          "Reforzá que, más allá de la confianza y la amistad que se haya generado, las " +
          "personas desconocidas siguen siendo desconocidas.",
      },
      {
        momento: "prevencion",
        texto:
          "Respetá la privacidad de los niños y adolescentes. Por ejemplo, no ingreses a " +
          "escondidas a sus cuentas.",
        porQue:
          "🔴 Es el Ministerio diciendo lo mismo que las reglas 2 y 3 de AntiGro. No es una " +
          "postura nuestra: es lo que recomienda el organismo.",
      },
      {
        momento: "prevencion",
        texto:
          "Acompañá la vida online de tus hijos. Conocé las páginas o redes sociales visitadas " +
          "frecuentemente.",
      },
      {
        momento: "prevencion",
        texto: "Explicales con franqueza sobre estas medidas para concientizarlos.",
        porQue: "🔑 Con franqueza, no a escondidas. Es la regla 3 otra vez, dicha por ellos.",
      },
      {
        momento: "prevencion",
        texto: "Evitá compartir fotos de tus hijos con el uniforme del colegio.",
        porQue: "El uniforme dice a qué colegio va y en qué barrio está.",
      },
      {
        momento: "prevencion",
        texto: "Enseñales a no hacer videoconferencias con desconocidos.",
      },
      {
        momento: "prevencion",
        texto: "Da el ejemplo. Usá con responsabilidad tus propias redes sociales.",
      },

      /* ── Si el chico cuenta ── */
      {
        momento: "si_el_chico_cuenta",
        texto: "Si el niño te cuenta algo, escuchalo con atención.",
      },
      {
        momento: "si_el_chico_cuenta",
        texto:
          "No lo avergüences ni lo culpes, así se sentirá confiado para revelar lo sucedido.",
      },
      {
        momento: "si_el_chico_cuenta",
        texto: "Evitá interrogarlo.",
        porQue:
          "🔴 Es lo que un padre asustado hace primero, y es lo que cierra la puerta. El " +
          "organismo lo pone como una indicación, no como un matiz.",
      },
      {
        momento: "si_el_chico_cuenta",
        texto: "Acompañalo con afecto. Es importante que sepa que no está solo.",
      },
      {
        momento: "si_el_chico_cuenta",
        texto:
          "Comprendé que sufría un estado de amenaza o chantaje que lo llevó a responder los " +
          "mensajes.",
        porQue:
          "🔑 Explica por qué el chico «siguió hablándole». No fue voluntad: fue coerción.",
      },
      {
        momento: "si_el_chico_cuenta",
        texto: "Buscá apoyo profesional para darle herramientas y contención emocional.",
      },

      /* ── Si ya pasó ── */
      {
        momento: "si_ya_paso",
        texto: "No borres contenido de la computadora, tableta o teléfono celular.",
        porQue:
          "🔴 Es lo primero que hace un padre —borrar lo que le duele— y destruye la prueba.",
      },
      {
        momento: "si_ya_paso",
        texto:
          "Guardá las conversaciones, las imágenes y los videos. Hacé capturas de pantalla y " +
          "guardalas en formato digital o impreso.",
      },
      {
        momento: "si_ya_paso",
        texto: "No amenaces directamente al acosador para que no se aleje.",
        porQue:
          "🔴 Va contra el instinto por completo, y por eso hay que decirlo: si se asusta, " +
          "borra todo y desaparece, y con él la posibilidad de identificarlo.",
      },
      {
        momento: "si_ya_paso",
        texto: "Reportá el perfil en la plataforma digital por conducta inapropiada.",
      },
      {
        momento: "si_ya_paso",
        texto: "Denunciá al acosador en la fiscalía o comisaría más cercana.",
      },
      {
        momento: "si_ya_paso",
        texto:
          "Evitá divulgar el caso en redes sociales. La protección de la identidad del niño es clave.",
      },
      {
        momento: "si_ya_paso",
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
        texto: "Acompañalos sin invadir ni prohibir el uso.",
        porQue: "🔑 Las tres cosas en una línea, y es la que mejor resume el criterio entero.",
      },
      {
        momento: "prevencion",
        texto: "Preguntar con quiénes hablan en Internet.",
      },
      {
        momento: "prevencion",
        texto: "Procurar que se conecten a Internet en lugares comunes de la casa.",
      },
      {
        momento: "prevencion",
        texto: "Dialogar e informarles acerca de los riesgos existentes.",
      },
      {
        momento: "prevencion",
        texto: "Explicarles la diferencia entre lo público y lo privado.",
      },
      {
        momento: "prevencion",
        texto: "Prestar atención a los cambios repentinos de humor.",
        porQue: "📌 Es la misma recomendación que respalda dos preguntas del cuestionario.",
      },
      {
        momento: "prevencion",
        texto: "Observar posibles cambios en los horarios de conexión.",
        porQue:
          "📌 Es lo único que respalda institucionalmente que el sistema mire el horario. " +
          "⚠ No dice POR QUÉ, y por eso AntiGro tampoco lo afirma.",
      },
    ],
  },
];

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
export function recomendacionesParaElPrompt(): string {
  const bloques: string[] = [];

  for (const momento of ["prevencion", "si_el_chico_cuenta", "si_ya_paso"] as Momento[]) {
    const lineas: string[] = [`── ${NOMBRE_DEL_MOMENTO[momento]} ──`];

    for (const fuente of FUENTES) {
      for (const r of fuente.recomendaciones.filter((x) => x.momento === momento)) {
        lineas.push(`- "${r.texto}" (${fuente.organismo})`);
      }
    }
    bloques.push(lineas.join("\n"));
  }

  return bloques.join("\n\n");
}

/** Para mostrarlas en pantalla con su enlace, sin repetir la lista. */
export function organismosCitados(): { organismo: string; enlace: string; verificado: string }[] {
  return FUENTES.map((f) => ({
    organismo: f.organismo,
    enlace: f.enlace,
    verificado: f.verificado,
  }));
}
