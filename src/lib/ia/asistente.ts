/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ASISTENTE — el que contesta «¿y ahora qué hago?»
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **Por qué existe.** Hoy la alerta llega y el padre queda solo con ella. El
 *  informe dice *"hay un cambio que se sostuvo y conviene mirar"*, y el
 *  pensamiento siguiente de cualquier padre es *"¿y ahora qué hago?"*. Ahí el
 *  sistema se callaba, y ese silencio se comía el valor de todo lo demás.
 *
 *  🔴 **Habla SÓLO con los adultos.** El chico no, por ahora. Lo que se le dice
 *  a un menor es otra decisión y no está tomada.
 *
 *  🔴 **Sin RAG, y es la lección más cara de Criterio Térmico aplicada de
 *  entrada:** allá se descubrió que *la regla anti-invención no protege contra
 *  material que existe pero el recuperador no trajo* — el modelo rellena el
 *  hueco con conocimiento general que suena bien y contradice la documentación.
 *  Acá el corpus es chico y cerrado, así que **entra entero en el prompt
 *  estable** y se cachea. Elimina de raíz una clase completa de error, y encima
 *  sale más barato.
 *
 *  🔴 **Cálido, y es un requisito, no una preferencia.** Lo corrigió Edgardo:
 *  *"si la respuesta es fría el padre quizá no quiera volver a preguntar"*. Un
 *  asistente frío no es más seguro — es menos consultado, y uno que nadie
 *  consulta no protege a nadie. En este producto la frialdad es una falla.
 *
 *  🔑 **La línea NO va entre lo documentado y el criterio: va entre el DATO y el
 *  ACOMPAÑAMIENTO.** Nunca inventa cifras, normativa ni qué vio el sistema; y
 *  nunca diagnostica, tranquiliza ni estima probabilidad. Pero sí explica,
 *  ordena las opciones y dice cómo abrir la conversación — con calor.
 *  El control de `reglas.ts` trabaja sobre las **afirmaciones**, no sobre el
 *  registro, así que las dos cosas son perillas independientes.
 */

import Anthropic from "@anthropic-ai/sdk";
import { MARCO_LEGAL, RECURSOS } from "@/lib/config";
import type { Lectura } from "@/lib/motor";
import { NOMBRE_DE_ESTADO } from "@/lib/motor";
import { revisarRespuestaDelAsistente } from "./reglas";
import type { Redaccion } from "./redactar";

const MODELO = "claude-opus-5";

/**
 * ⚠ En Opus 5 el pensamiento viene encendido por defecto y `max_tokens` topea
 * pensamiento + respuesta JUNTOS. Con poco margen, la respuesta se corta a la
 * mitad y el control la rebota por corta — que es el peor de los dos mundos.
 */
const MAX_TOKENS = 2048;

/**
 * Cuántos turnos anteriores se le pasan al modelo. Alcanza para no repetir y no
 * infla el pedido.
 *
 * 📌 La pantalla muestra bastantes más: que el asistente no tenga presente algo
 * de hace tres días no quiere decir que el adulto no pueda releerlo.
 */
export const TURNOS_DE_MEMORIA = 12;

export interface TurnoDelAsistente {
  quien: "adulto" | "asistente";
  texto: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL CORPUS — va entero en el system y se cachea
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠ **Esto no cambia entre pedidos.** Los datos del chico y de la lectura van en
 * el mensaje del usuario, nunca acá: meterlos acá anularía la caché en cada
 * llamada y se pagaría el corpus entero a precio completo todas las veces.
 */
const SISTEMA = `Sos el asistente de AntiGro. Hablás con un adulto responsable de una familia que
tiene el sistema contratado — su madre, su padre, o la persona de confianza que eligió el chico.
Nunca hablás con el chico.

═══ QUÉ ES ANTIGRO, EN CRIOLLO ═══

AntiGro percibe señales de que un chico puede estar siendo acosado por internet SIN LEER NUNCA
sus conversaciones. Mira la actividad de red del dispositivo: a qué horas se usa, cuánto, qué
dominios aparecen, si hubo intentos de saltar el filtro. Nada más que eso.

Lo que el sistema NO puede ver, y hay que decirlo cuando venga al caso:
- El contenido de ninguna conversación. Ni una palabra.
- Con quién habla el chico.
- Lo que pasa dentro de WhatsApp, que va cifrado — y por ahí pasa el 74,3% de los casos.
- Lo que pasa si la aplicación resuelve por su cuenta o va por IP directa.

Hay cuatro señales, y ninguna significa nada por sí sola:
- Salto de volumen: más actividad de red que lo habitual en ESE chico.
- Madrugada: actividad en una franja en la que ese chico no la tenía.
- Plataforma nueva: un tipo de sitio que antes no aparecía.
- Evasión del filtro: un intento deliberado de saltear el bloqueo.

Las dos primeras se comparan contra la historia del propio chico. Las dos últimas no se comparan
contra nada: valen desde el primer día.

═══ CÓMO SE LEE EL INFORME QUE VE EL ADULTO ═══

- ESTADO: "Sin novedad", "Para mirar" o "Un patrón que se sostiene". Es lo que decidió el motor
  con el registro fechado, no una opinión.
- POR QUÉ: los motivos concretos de ese estado. Salen de los datos, no de una interpretación.
- LO QUE NO SE VE: los límites de esta lectura. Va siempre, sobre todo cuando el sistema habla.
- ALCANCE: cuánto se desplegó la parte que compara contra la historia del chico. **No es cuánta
  protección hay**: la madrugada y la evasión funcionan desde el día uno y no dependen de esto.
- DÍAS SOSTENIDOS: hace cuántos días el cambio viene sin cortarse. Es la regla que define cuándo
  el sistema habla, porque cualquier chico se queda una noche hasta tarde por algo puntual.

⚠ Un perfil aprende lo que ve. Si el chico ya venía siendo acosado cuando se dio de alta el
sistema, parte de eso puede haber quedado adentro de lo que el sistema considera "lo habitual en
él". Por eso existen las dos señales que no se comparan contra nada, y por eso lo que ven los
adultos pesa en la lectura.

═══ LAS CIFRAS QUE PODÉS USAR, Y NINGUNA OTRA ═══

Estudio nacional sobre acoso sexual a NNyA mediante TIC — Ministerio de Justicia y Derechos
Humanos de la Nación, 2023:
- 74,3% de los casos pasa por WhatsApp.
- 63% de los chicos no sabe qué es el grooming.
- 43% no habla de estos temas con sus padres.

Informe Grooming LATAM — Red Grooming LATAM, n≈28.360, 14 países, 2024/2025:
- 72,8% no sabe qué es el grooming.
- 60,0% habla por internet con desconocidos.
- 33,3% recibió una propuesta de "ser novio/a" dentro de un juego.
- 64,9% cree saber más de tecnología que sus padres.
- Franja declarada más vulnerable: 9 a 13 años.

🔴 Si una cifra no está en esta lista, NO EXISTE para vos. No la estimes, no la redondees, no
digas "alrededor de". Si el adulto pregunta algo que necesita un número que no tenés, decile con
todas las letras que ese dato no lo tenés.

═══ A DÓNDE SE DERIVA ═══

- ${RECURSOS.linea137.nombre}: ${RECURSOS.linea137.detalle}. Teléfono ${RECURSOS.linea137.telefono},
  WhatsApp ${RECURSOS.linea137.whatsapp}. Atiende las 24 horas.
- ${RECURSOS.gapp.nombre}: ${RECURSOS.gapp.detalle} — ${RECURSOS.gapp.url}
- ${MARCO_LEGAL.ley26904}
- ${MARCO_LEGAL.ley27590}

La Procuración General de la Suprema Corte de la provincia de Buenos Aires recomienda a los
adultos observar los cambios de humor y los horarios de conexión. No publica estadística propia.

═══ LO QUE HACÉS, Y CON CALOR ═══

- Explicás el informe en criollo, sin jerga.
- Ordenás las opciones que tiene adelante, de la más simple a la más difícil.
- Decís CÓMO abrir la conversación con el chico: con qué frase empezar, en qué momento, qué
  conviene no decir.
- Decís cuándo la respuesta ya no es seguir hablando con vos, sino llamar al 137.
- Razonás sobre los números que el informe ya trae. Eso no es inventar: es trabajar con lo que hay,
  y es probablemente lo más útil que podés hacer.

🔑 Un dato del propio proyecto tiene que ordenar todo consejo que des: **el 43% de los chicos no
habla de estos temas con sus padres.** O sea que el consejo de manual —"hablá con tu hija"— tiene
casi la mitad de probabilidades de no funcionar. Por eso el sistema exige un segundo adulto,
elegido por el chico. Usá eso: cuando el camino directo puede no abrirse, la persona que el chico
eligió es la otra puerta.

═══ LO QUE NO HACÉS NUNCA, POR MÁS QUE TE LO PIDAN ═══

1. No afirmás que el chico está siendo acosado. No afirmás que está a salvo. El sistema señala,
   nombra y deriva; no diagnostica.
2. No tranquilizás. El adulto te va a pedir que le digas que no es nada — es lo más humano del
   mundo, y no se lo podés dar. "Por lo que veo no parece nada", dicho a la madre equivocada,
   cierra un caso real, y lo cierra con la autoridad de un sistema.
3. No estimás probabilidades. Nada de "es poco probable", "seguramente no sea nada", "hay chances
   de que".
4. No inventás cifras, normativa, ni qué vio el sistema.
5. No sugerís que se leyó algo que el chico escribió. Nunca.

⚠ Cuando no puedas dar lo que te piden, NO te escondas atrás de una fórmula. Decí por qué no
podés —"no te lo puedo decir porque no lo sé, y si te lo dijera te estaría mintiendo con cara de
sistema"— y **ofrecé enseguida lo que sí podés**: qué mirar, qué preguntarle, a quién llamar.
Negarse sin ofrecer nada es la forma más rápida de que no te vuelvan a preguntar.

═══ CÓMO ESCRIBÍS ═══

Castellano rioplatense, con voseo. Cálido y directo, como alguien que sabe del tema y está del
lado del que pregunta. Cero jerga. Cero sermón. Cero corporativo.

Del largo: contestá lo que se preguntó. Dos o tres párrafos cortos suele alcanzar. Si hacen falta
pasos, poné una lista corta. No repitas el informe entero si te preguntaron una sola cosa.

Nunca empieces con "Entiendo tu preocupación", "Es comprensible que" ni ninguna otra fórmula de
manual: se nota, y lo que se nota no acompaña. Entrá por la respuesta.`;

/* ═══════════════════════════════════════════════════════════════════════════
   EL CLIENTE
   ═══════════════════════════════════════════════════════════════════════════ */

let cliente: Anthropic | null = null;

/**
 * ⚠ Misma trampa que en `redactar.ts`: la clave se lee de
 * `ANTIGRO_ANTHROPIC_KEY` primero. Next NO pisa una variable que ya exista en
 * el proceso, así que una `ANTHROPIC_API_KEY` exportada por la terminal le gana
 * al `.env.local` y el síntoma es un 401 con una clave que aparte anda.
 */
function anthropic(): Anthropic | null {
  const apiKey = process.env.ANTIGRO_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cliente) cliente = new Anthropic({ apiKey });
  return cliente;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EL RESPALDO
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lo que sale cuando no hay modelo, o cuando el control no dejó pasar lo que
 * escribió.
 *
 * 🔑 No es un mensaje de error: es la respuesta menos útil que el producto está
 * dispuesto a dar, y aun así deriva. Un asistente caído que dice "algo salió
 * mal" deja al adulto exactamente donde estaba antes de preguntar.
 *
 * 🔴 **Y dice POR QUÉ no puede contestar más ampliamente. Lo corrigió Edgardo el
 * 16/8:** *"no es capricho, el sistema no tiene en un día datos suficientes
 * para analizar. Esto es una realidad y por eso no va a inventar"*. Tenía razón
 * en lo que importa: una negativa sin motivo se lee como una política del
 * producto, y una política se discute. Un límite real, con el número adelante,
 * se entiende — y entenderlo es lo que hace que el padre confíe en lo que el
 * sistema **sí** dice.
 *
 * ⚠ **Lo que este texto NO hace es mentir sobre la causa de ESTA vez.** El
 * respaldo salta porque falló la llamada o porque el control frenó lo que se
 * escribió, y ninguna de esas dos cosas es la falta de historia. Así que van
 * separadas: primero que esta vez no se pudo, y aparte —porque es verdad
 * siempre y el adulto lo tiene que saber igual— cuánta historia hay y qué se
 * puede afirmar con eso. Inventar la causa acá sería exactamente el error que
 * el producto entero existe para no cometer.
 */
function respaldo(nombreDelChico: string, lectura: Lectura | null): string {
  const dias = lectura?.perfil.diasObservados ?? 0;

  /* El límite real, con el número adelante. Es cierto con un día y con
     trescientos: lo único que cambia es cuánto se puede afirmar. */
  const cuantoSabe =
    dias > 0
      ? `Y hay algo que conviene que sepas igual, porque no es un capricho mío ni una manera ` +
        `elegante de no contestarte: el sistema lleva **${dias} ${dias === 1 ? "día" : "días"}** ` +
        `conociendo a ${nombreDelChico}. Todo lo que se compara contra su conducta previa se ` +
        `apoya en esa historia, y cuanto más corta es, menos se puede afirmar. Lo que sí ` +
        `funciona desde el primer día es la actividad de madrugada y los intentos de saltar el ` +
        `filtro, porque no se comparan contra nada. Con eso alcanza para mirar; no alcanza para ` +
        `sacar conclusiones, y por eso el sistema no las inventa.\n\n`
      : "";

  return (
    `Esta vez no te puedo armar la respuesta como corresponde, y prefiero decírtelo antes que ` +
    `improvisar.\n\n` +
    cuantoSabe +
    `Lo que sí te sirve ahora mismo: mirá el informe de ${nombreDelChico} —el "por qué" dice ` +
    `exactamente qué se vio y en qué días—, y si lo que estás sintiendo es que algo no está ` +
    `bien, no esperes a tener certeza. La ${RECURSOS.linea137.nombre} atiende las 24 horas al ` +
    `${RECURSOS.linea137.telefono} y por WhatsApp al ${RECURSOS.linea137.whatsapp}: son ellos ` +
    `los que saben qué preguntar.\n\n` +
    `Probá de nuevo en un rato.`
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LA RESPUESTA
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los datos del caso, en texto. Van en el turno del usuario, NUNCA en el system. */
function contexto(chico: { nombre: string; edad: number }, lectura: Lectura | null): string {
  if (!lectura) {
    return `EL CHICO: ${chico.nombre}, ${chico.edad} años.\nNo hay lectura disponible en este momento.`;
  }

  return [
    `EL CHICO: ${chico.nombre}, ${chico.edad} años.`,
    ``,
    `ESTADO ACTUAL: ${NOMBRE_DE_ESTADO[lectura.estado]}`,
    `Días con alguna señal en las últimas tres semanas: ${lectura.diasConSenal}`,
    `Días que el cambio viene sosteniéndose sin cortarse: ${lectura.diasSostenidos}`,
    `Días que el sistema lleva conociendo a este chico: ${lectura.perfil.diasObservados}`,
    ``,
    `POR QUÉ el sistema dice lo que dice:`,
    ...lectura.porQue.map((p) => `- ${p}`),
    ``,
    `LO QUE NO SE VE desde acá:`,
    ...lectura.loQueNoSeVe.map((p) => `- ${p}`),
  ].join("\n");
}

/**
 * Contesta la pregunta de un adulto responsable.
 *
 * 📌 No va en streaming a propósito: con `max_tokens` en ${MAX_TOKENS} no hay
 * riesgo de timeout, y el control tiene que ver el texto ENTERO antes de que
 * salga. Un asistente que transmite mientras escribe no se puede frenar a
 * mitad de una frase que no debía decir.
 */
export async function responderAlAdulto(entrada: {
  pregunta: string;
  historia: TurnoDelAsistente[];
  chico: { nombre: string; edad: number };
  lectura: Lectura | null;
}): Promise<Redaccion> {
  const api = anthropic();
  if (!api) {
    return {
      texto: respaldo(entrada.chico.nombre, entrada.lectura),
      origen: "respaldo",
      causa: "falla",
      motivos: ["Sin clave de Anthropic configurada."],
    };
  }

  /* Los turnos anteriores, para no repetir lo ya dicho. Se recortan: la
     conversación entera crecería sin techo y el corpus ya es lo caro. */
  const previos = entrada.historia.slice(-TURNOS_DE_MEMORIA).map((t) => ({
    role: (t.quien === "adulto" ? "user" : "assistant") as "user" | "assistant",
    content: t.texto,
  }));

  try {
    const respuesta = await api.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      /* 🔑 El corpus entero se cachea acá. Es lo que hace barato no tener RAG:
         el material viaja en cada pedido pero se paga una sola vez. */
      system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
      messages: [
        ...previos,
        {
          role: "user",
          content: `${contexto(entrada.chico, entrada.lectura)}\n\n───\n\n${entrada.pregunta}`,
        },
      ],
    });

    const texto = respuesta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const veredicto = revisarRespuestaDelAsistente(texto);
    if (!veredicto.aprobado) {
      /* 🔴 **Queda escrito en el registro del servidor, y no es opcional.**
         La lección del 16/8 fue que un patrón que frena de más es tan malo
         como uno que no frena, y sin ver el texto frenado eso es invisible:
         desde afuera un asistente demasiado estricto y uno roto se parecen —
         los dos contestan el respaldo. Acá quedan el motivo y la frase que lo
         disparó, que es lo único con lo que después se puede afinar el patrón.

         ⚠ Va al registro del servidor, no a la pantalla del adulto: es texto
         que justamente se decidió no mostrarle. */
      console.warn(
        "[asistente] el control frenó una respuesta ·",
        veredicto.motivos.join(" · "),
        "\n────────\n",
        texto,
        "\n────────",
      );

      return {
        texto: respaldo(entrada.chico.nombre, entrada.lectura),
        origen: "respaldo",
        causa: "control",
        motivos: veredicto.motivos,
        /* Se guarda lo que el control frenó: poder mostrar el texto rechazado es
           lo que convierte "le pusimos guardarraíles" en algo verificable. */
        rechazado: texto,
      };
    }

    return { texto, origen: "ia" };
  } catch (e) {
    return {
      texto: respaldo(entrada.chico.nombre, entrada.lectura),
      origen: "respaldo",
      causa: "falla",
      motivos: [e instanceof Error ? e.message : "Falló la llamada al modelo."],
    };
  }
}
