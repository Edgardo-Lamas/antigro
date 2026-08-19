/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUESTIONARIO DEL ADULTO — la segunda entrada
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  La red aporta el **cuándo**. Los adultos aportan el **cómo está**.
 *
 *  🔴 Advertencia de procedencia, y va en serio:
 *  El estudio del Ministerio de Justicia publica cifras de **prevalencia**, no
 *  una lista de indicadores conductuales validados. La literatura internacional
 *  de indicadores existe, pero según el `CLAUDE.md` **no está verificada en
 *  fuente primaria**.
 *
 *  Por eso cada pregunta declara de dónde sale, y hay tres clases:
 *
 *  - `estudio` — se apoya en una cifra citable.
 *  - `organismo` — un organismo oficial recomienda mirar eso, **pero sin una
 *    cifra detrás**. Vale más que nuestra intuición y menos que un porcentaje,
 *    y por eso no se puede presentar como si fuera una medición.
 *  - `observable` — le pregunta al adulto por un **hecho que puede ver**, sin
 *    afirmar que ese hecho sea un signo de grooming. Es la diferencia entre
 *    "¿esconde la pantalla?" (un hecho) y "esconder la pantalla indica
 *    grooming" (una afirmación que no podemos sostener).
 *
 *  ⚠ Ninguna pregunta de esta lista puede presentarse en el video como
 *  "indicador validado". Se presentan como lo que son: lo que un adulto ve.
 */

export type ProcedenciaDelIndicador =
  | { clase: "estudio"; cita: string }
  | { clase: "organismo"; cita: string }
  | { clase: "observable"; nota: string };

export interface Indicador {
  id: string;
  pregunta: string;
  /** Para el adulto que duda de qué se le está preguntando. */
  ayuda: string;
  /** 📌 Decisión de producto. Cuánto mueve la aguja respecto de los demás. */
  peso: number;
  procedencia: ProcedenciaDelIndicador;
}

/** Escala de respuesta. La misma para todas, para no confundir al que contesta. */
export const ESCALA = [
  { valor: 0, etiqueta: "No / nunca" },
  { valor: 1, etiqueta: "Alguna vez" },
  { valor: 2, etiqueta: "Varias veces" },
  { valor: 3, etiqueta: "Seguido" },
] as const;

export const VALOR_MAXIMO = 3;

export const INDICADORES: Indicador[] = [
  {
    id: "desconocidos",
    pregunta: "¿Sabés si habla por internet con gente que no conoce en persona?",
    ayuda: "Juegos en línea, grupos, gente que apareció hace poco.",
    peso: 1,
    procedencia: {
      clase: "estudio",
      cita: "El 56,4% de los chicos de 9 a 17 habla con desconocidos (Grooming Argentina, n=4.276, citado en el estudio nacional 2023).",
    },
  },
  {
    id: "noviazgo_en_juego",
    pregunta: "¿Sabés si alguien le propuso «ser su novio o novia» en un juego o en una app?",
    ayuda: "Pasa seguido en los juegos en línea, y muchas veces con alguien que no conoce en persona.",
    // 🔑 Pesa como los regalos: las dos son etapas del mecanismo, no del daño.
    peso: 1.3,
    procedencia: {
      clase: "estudio",
      cita: "El 33,3% recibió una propuesta de noviazgo dentro de un juego en línea (Informe Grooming LATAM, n≈28.360 de 9 a 17 años en 14 países, relevamiento 2024/2025).",
    },
  },
  {
    id: "pedido_de_fotos",
    pregunta: "¿Sabés si alguna vez le pidieron una foto suya?",
    ayuda: "Cualquiera, no sólo las que uno se imagina.",
    peso: 1.4,
    procedencia: {
      clase: "estudio",
      cita: "El 35,4% recibió un pedido de fotos desnudo o con poca ropa (Grooming Argentina, n=4.276, citado en el estudio nacional 2023).",
    },
  },
  {
    id: "sabe_que_es_grooming",
    pregunta: "¿Hablaron alguna vez con él o ella sobre qué es el grooming?",
    ayuda: "Si nunca se habló del tema, la respuesta es «no».",
    // Se invierte al puntuar: acá el riesgo está en el NO.
    peso: 0.9,
    procedencia: {
      clase: "estudio",
      cita: "El 63% de los chicos no sabe qué es el grooming, y el 43% no habla del tema con sus padres (estudio nacional 2023).",
    },
  },
  {
    id: "cambio_de_animo",
    pregunta: "¿Notaste que cambia de ánimo después de estar con el teléfono?",
    ayuda: "Queda callado, irritable o angustiado al dejarlo, y antes no pasaba.",
    peso: 1.2,
    procedencia: {
      clase: "organismo",
      cita: "El Ministerio Público de la Provincia de Buenos Aires (Procuración General de la SCBA) recomienda a los adultos «observar cambios de humor y horarios de conexión». https://www.mpba.gov.ar/grooming",
    },
  },
  {
    id: "esconde_pantalla",
    pregunta: "¿Esconde la pantalla o cambia de aplicación cuando te acercás?",
    ayuda: "Que un adolescente quiera privacidad es normal. Lo que se pregunta es si es nuevo.",
    peso: 1,
    procedencia: {
      clase: "observable",
      nota: "Hecho observable. ⚠ La privacidad adolescente es esperable: por sí solo no dice nada.",
    },
  },
  {
    id: "se_aisla",
    pregunta: "¿Dejó actividades o amistades que antes le importaban?",
    ayuda: "Deportes, salidas, amigos de siempre.",
    peso: 1.2,
    procedencia: {
      clase: "observable",
      nota: "Hecho observable. No hay fuente primaria verificada que lo valide como indicador de grooming.",
    },
  },
  {
    id: "regalos",
    pregunta: "¿Apareció algo que no sabés de dónde salió?",
    ayuda: "Crédito para juegos, saldo, una cuenta paga, un objeto.",
    peso: 1.3,
    procedencia: {
      clase: "observable",
      nota: "Hecho observable. No hay fuente primaria verificada que lo valide como indicador de grooming.",
    },
  },
  {
    id: "horarios",
    pregunta: "¿Usa el teléfono a horas en que antes dormía?",
    ayuda: "De madrugada, o apenas se despierta.",
    peso: 0.9,
    procedencia: {
      clase: "organismo",
      cita: "El Ministerio Público de la Provincia de Buenos Aires (Procuración General de la SCBA) recomienda a los adultos «observar cambios de humor y horarios de conexión». https://www.mpba.gov.ar/grooming — 🔑 Además se cruza con lo que ve la red, que mira exactamente lo mismo desde el otro lado.",
    },
  },
];

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  JUNTAR LO QUE CONTESTARON VARIOS ADULTOS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **No es una votación ni una competencia entre adultos**, y conviene
 *  decirlo porque la formulación corta suena a eso. Lo que se arma acá es UNA
 *  sola descripción de la conducta del chico, hecha con los pedazos que cada
 *  adulto pudo ver. Las dos reglas salen de ahí:
 *
 *  1. **De cada adulto vale su última respuesta.** El cuestionario se vuelve a
 *     contestar —la conducta de un chico cambia y el cuestionario está para
 *     seguirla—, y lo que dijo alguien hace tres semanas no puede seguir
 *     pesando cuando ya dijo otra cosa. No se acumula: se reemplaza.
 *
 *  2. 🔑 **De cada PREGUNTA queda la respuesta más alta, venga de quien venga.**
 *     Es por pregunta y no por persona: el padre puede quedar arriba en los
 *     horarios y la madre en los regalos. **Nadie gana.**
 *     El porqué: **nadie ve el día entero de un chico.** Que un adulto no haya
 *     visto algo no es prueba de que no pasó — es que no estaba delante. Por eso
 *     no se promedia: promediar partiría al medio una observación real por la
 *     ausencia del otro, que es justamente el dato que no tenemos.
 *
 *  ⚠ **La consecuencia, dicha de frente: esto sólo puede subir, nunca bajar.**
 *  Un adulto angustiado que marca todo «seguido» manda sobre el resto. Se
 *  acepta —subestimar es peor que mirar de más—, y desde el 18/8 se puede ver
 *  de dónde vino: la firma de quién contestó se muestra en el panel.
 *
 *  🔴 **Vive acá y no en las rutas, y eso arregla un desacuerdo real (19/8).**
 *  Estaba escrita dos veces: el panel aplicaba las dos reglas y el asistente
 *  sólo la segunda. Con eso, un adulto que corregía su respuesta veía el cambio
 *  en el panel mientras el asistente le seguía hablando con la respuesta vieja.
 *  **Dos pantallas del mismo sistema diciendo cosas distintas del mismo chico.**
 */
export function juntarObservaciones(
  observaciones: { adultoId: string; fecha: string; respuestas: Record<string, number> }[],
): Record<string, number> {
  const ultimaDeCadaUno = new Map<string, { fecha: string; respuestas: Record<string, number> }>();
  for (const o of observaciones) {
    const previa = ultimaDeCadaUno.get(o.adultoId);
    if (!previa || o.fecha > previa.fecha) {
      ultimaDeCadaUno.set(o.adultoId, { fecha: o.fecha, respuestas: o.respuestas });
    }
  }

  const juntas: Record<string, number> = {};
  for (const { respuestas } of ultimaDeCadaUno.values()) {
    for (const [indicador, valor] of Object.entries(respuestas)) {
      juntas[indicador] = Math.max(juntas[indicador] ?? 0, valor);
    }
  }
  return juntas;
}

/** Los indicadores que se invierten: el riesgo está en la respuesta baja. */
const INVERTIDOS = new Set(["sabe_que_es_grooming"]);

export interface AporteDeLosAdultos {
  /** 0 a 1. */
  puntaje: number;
  /** Cuántas preguntas contestaron. */
  respondidas: number;
  /** Lo que más pesó, para poder mostrarlo. */
  loQueMasPeso: string[];
}

/**
 * Convierte las respuestas del cuestionario en un aporte de 0 a 1.
 * Sin respuestas devuelve 0: **la ausencia de datos no es una señal de calma.**
 * El motor lo trata como "no sabemos", no como "está todo bien".
 */
export function evaluarObservaciones(respuestas: Record<string, number>): AporteDeLosAdultos {
  let acumulado = 0;
  let maximo = 0;
  let respondidas = 0;
  const conPeso: { texto: string; valor: number }[] = [];

  for (const indicador of INDICADORES) {
    const cruda = respuestas[indicador.id];
    if (cruda === undefined || cruda === null) continue;

    respondidas++;
    const valor = INVERTIDOS.has(indicador.id) ? VALOR_MAXIMO - cruda : cruda;
    const aporte = (valor / VALOR_MAXIMO) * indicador.peso;

    acumulado += aporte;
    maximo += indicador.peso;

    if (valor >= 2) conPeso.push({ texto: indicador.pregunta, valor: aporte });
  }

  return {
    puntaje: maximo === 0 ? 0 : Math.min(1, acumulado / maximo),
    respondidas,
    loQueMasPeso: conPeso
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 3)
      .map((c) => c.texto),
  };
}
