/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA IA — pone en palabras lo que el motor ya decidió
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 El modelo NO decide nada. No decide si hay riesgo, no decide si hay que
 * alertar, no decide a quién derivar. Todo eso lo resolvió el motor con el
 * registro fechado. Acá el modelo hace una sola cosa: escribirlo para una
 * persona concreta, con la edad que tiene.
 *
 * Y lo que escribe pasa por `reglas.ts` antes de salir. Si no pasa, sale el
 * texto de respaldo. Ver `respaldo.ts`.
 */

import Anthropic from "@anthropic-ai/sdk";
import { bandaDeEdad, type BandaDeEdad } from "@/lib/config";
import type { Estado, Lectura } from "@/lib/motor";
import { NOMBRE_DE_ESTADO } from "@/lib/motor";
import { revisarLecturaParaAdultos, revisarMensajeAlChico } from "./reglas";
import { respaldoParaElChico, respaldoParaLosAdultos } from "./respaldo";

const MODELO = "claude-opus-5";

/**
 * ⚠ En Opus 5 el pensamiento viene encendido por defecto y `max_tokens` topea
 * pensamiento + respuesta JUNTOS. Con 512 las respuestas se cortan a la mitad.
 */
const MAX_TOKENS = 2048;

/**
 * Tope de caracteres que se le pide al modelo, por banda. Va por debajo del
 * que revisa el control, para que un desborde chico no tire todo al respaldo.
 * ⚠ En Opus 5 el `effort` NO acorta la salida visible: el largo se pide en el
 * prompt o no se consigue.
 */
const TOPE_POR_BANDA: Record<BandaDeEdad, number> = {
  "7-10": 260,
  "11-13": 520,
  "14-17": 700,
};

export interface Redaccion {
  texto: string;
  /** De dónde salió. Se muestra en pantalla: el jurado tiene que poder verlo. */
  origen: "ia" | "respaldo";
  /** Por qué se cayó al respaldo, si es el caso. */
  motivos?: string[];
  /**
   * Lo que el modelo había escrito y el control no dejó salir.
   * Se guarda a propósito: poder mostrar el texto frenado es lo que
   * convierte "le pusimos guardarraíles" en algo que se puede verificar.
   */
  rechazado?: string;
}

let cliente: Anthropic | null = null;

/**
 * ⚠ La clave se lee de `ANTIGRO_ANTHROPIC_KEY` primero, y recién después de
 * `ANTHROPIC_API_KEY`.
 *
 * No es capricho: Next.js NO pisa una variable que ya exista en el proceso, así
 * que si la terminal que levanta el servidor exporta su propia
 * `ANTHROPIC_API_KEY`, esa gana y el `.env.local` del proyecto queda ignorado —
 * y el síntoma es un 401 con una clave que, probada aparte, anda perfecto.
 * Con un nombre propio, la del proyecto no la pisa nadie.
 */
function claveDeAnthropic(): string | undefined {
  return process.env.ANTIGRO_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY || undefined;
}

function anthropic(): Anthropic | null {
  const apiKey = claveDeAnthropic();
  if (!apiKey) return null;
  if (!cliente) cliente = new Anthropic({ apiKey });
  return cliente;
}

/* ── El prompt estable ───────────────────────────────────────────────────── */

/**
 * ⚠ Esto no cambia entre pedidos: va en el system y se cachea. Los datos del
 * chico y de la lectura van en el mensaje del usuario, nunca acá — meterlos
 * acá anularía la caché en cada llamada.
 */
const SISTEMA = `Sos el redactor de AntiGro, un sistema que percibe señales de que un chico
puede estar siendo acosado por internet SIN LEER NUNCA sus conversaciones.

Tu única tarea es poner en palabras una conclusión que YA está tomada. No evalúes el riesgo,
no decidas si hay que avisar, no elijas a quién derivar: todo eso viene resuelto en los datos
que recibís. Vos escribís.

REGLAS QUE NO SE NEGOCIAN

1. Nunca afirmes que el chico está siendo acosado. Nunca afirmes que está a salvo.
   El sistema señala, nombra y deriva. No diagnostica.
2. Nunca sugieras que se leyó algo que el chico escribió. No se lee el contenido de las
   conversaciones: se ven horarios, volúmenes y categorías de dominio. Si el texto puede
   dar a entender que alguien leyó sus mensajes, está mal escrito.
3. Las señales son de RED, no de mensajería. "Salto de volumen" es volumen de actividad de
   red, nunca de mensajes; "plataforma nueva" es un sitio que antes no aparecía, no una
   conversación. Nunca escribas "volumen de mensajes" ni nada que dé a entender que el
   sistema cuenta o ve mensajes.
4. No inventes cifras. Usá sólo las que aparezcan en los datos que recibís. Si no hay una
   cifra en los datos, no pongas ninguna.
5. Nunca culpes al chico, ni siquiera de forma indirecta. Nada de "tendrías que haber",
   "por qué no contaste", "es peligroso que hables con desconocidos".
6. Escribí en castellano rioplatense, con voseo. Registro cordial, cero jerga técnica.

CÓMO SE LE HABLA A CADA EDAD

- 7 a 10 años: corto y muy concreto. Una sola idea. Sin abstracciones y sin la palabra
  "grooming". Se lo deriva a un adulto de la casa. NO le nombres la Línea 137: a esa edad
  el que llama es un adulto.
- 11 a 13 años: se le explica el mecanismo, no sólo la regla. Se nombra el grooming como lo
  que es, un delito, y se aclara que le pasa a mucha gente. Se lo deriva a un adulto de
  confianza y se le nombra la Línea 137.
- 14 a 17 años: de igual a igual. Nada que suene a reto, a control ni a sermón. No des por
  sentado que el adulto es la salida. Se le nombra el adulto que él mismo eligió, la
  Línea 137 y la posibilidad de denunciar.

GUARDARRAÍL DE GÉNERO
Lo único que cambia según el género es qué tipo de riesgo se enfatiza, y sólo donde hay dato
que lo respalde. El tono y el respeto son idénticos para todos. Si el mensaje suena distinto
para un varón que para una nena más allá de eso, está mal.

LARGO — esto es un límite, no una sugerencia
Un mensaje que no se lee no protege a nadie. Respetá el tope de caracteres que te indican
en los datos. Si no entra, sacá explicaciones: lo que no se puede sacar es que quede claro
que no es culpa suya y a quién puede recurrir.

FORMA DE LA RESPUESTA
Devolvé únicamente el texto que se va a mandar. Sin encabezados, sin comillas, sin explicar
lo que hiciste y sin ofrecer alternativas. Lo que escribas se manda tal cual.`;

/* ── La llamada ──────────────────────────────────────────────────────────── */

async function pedirTexto(datos: string): Promise<{ texto: string } | { error: string }> {
  const api = anthropic();
  if (!api) return { error: "Falta ANTHROPIC_API_KEY" };

  try {
    const respuesta = await api.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "medium" },
      system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: datos }],
    });

    // Los clasificadores pueden declinar. Hay que mirar esto ANTES del contenido.
    if (respuesta.stop_reason === "refusal") {
      return { error: "El modelo declinó la solicitud" };
    }

    const texto = respuesta.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!texto) return { error: "El modelo no devolvió texto" };
    return { texto };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al llamar al modelo" };
  }
}

/* ── El mensaje al chico ─────────────────────────────────────────────────── */

export async function redactarMensajeAlChico(entrada: {
  nombre: string;
  edad: number;
  genero: string;
  estado: Estado;
}): Promise<Redaccion | null> {
  // En calma no se le escribe. El silencio también es una decisión del motor.
  if (entrada.estado === "en_calma") return null;

  const banda: BandaDeEdad = bandaDeEdad(entrada.edad);
  const respaldo = respaldoParaElChico(banda, entrada.estado)!;

  const datos = [
    `Escribile a ${entrada.nombre}, de ${entrada.edad} años (banda ${banda}).`,
    `Género: ${entrada.genero}.`,
    `Lo que resolvió el motor: ${NOMBRE_DE_ESTADO[entrada.estado]}.`,
    `Tope: ${TOPE_POR_BANDA[banda]} caracteres. No lo pases.`,
    entrada.estado === "patron_sostenido"
      ? "El cambio se sostuvo durante días. Es el momento de hablarle en serio, sin asustarlo."
      : "Hubo un cambio que todavía no se sostiene. El mensaje es preventivo, no urgente.",
    "",
    "Cifras que podés usar si te sirven (no hace falta usar ninguna):",
    "· El 63% de los chicos no sabe qué es el grooming.",
    "· El 43% no habla de estos temas con sus padres.",
  ].join("\n");

  const resultado = await pedirTexto(datos);
  if ("error" in resultado) {
    return { texto: respaldo.texto, origen: "respaldo", motivos: [resultado.error] };
  }

  const veredicto = revisarMensajeAlChico(resultado.texto, banda);
  if (!veredicto.aprobado) {
    return {
      texto: respaldo.texto,
      origen: "respaldo",
      motivos: veredicto.motivos,
      rechazado: resultado.texto,
    };
  }

  return { texto: resultado.texto, origen: "ia" };
}

/* ── La lectura para los adultos ─────────────────────────────────────────── */

export async function redactarLecturaParaAdultos(entrada: {
  nombreDelChico: string;
  edad: number;
  lectura: Lectura;
}): Promise<Redaccion | null> {
  if (entrada.lectura.estado === "en_calma") return null;

  const respaldo = respaldoParaLosAdultos({
    nombreDelChico: entrada.nombreDelChico,
    estado: entrada.lectura.estado,
    porQue: entrada.lectura.porQue,
    loQueNoSeVe: entrada.lectura.loQueNoSeVe,
  });

  const datos = [
    `Escribiles a los adultos responsables de ${entrada.nombreDelChico}, de ${entrada.edad} años.`,
    `Lo que resolvió el motor: ${NOMBRE_DE_ESTADO[entrada.lectura.estado]}.`,
    "",
    "Qué se vio (usá esto, no agregues nada que no esté acá):",
    ...entrada.lectura.porQue.map((p) => `· ${p}`),
    "",
    "Qué NO se puede saber desde acá (tiene que quedar dicho, no lo omitas):",
    ...entrada.lectura.loQueNoSeVe.map((p) => `· ${p}`),
    "",
    "Tope: 1500 caracteres. No lo pases.",
    "Cerrá con qué mirar ahora. Si el patrón se sostuvo, la conversación con el chico va sin",
    "acusar y sin mostrarle esto como una prueba; y la Línea 137 orienta gratis las 24 horas.",
  ].join("\n");

  const resultado = await pedirTexto(datos);
  if ("error" in resultado) {
    return { texto: respaldo, origen: "respaldo", motivos: [resultado.error] };
  }

  const veredicto = revisarLecturaParaAdultos(resultado.texto);
  if (!veredicto.aprobado) {
    return {
      texto: respaldo,
      origen: "respaldo",
      motivos: veredicto.motivos,
      rechazado: resultado.texto,
    };
  }

  return { texto: resultado.texto, origen: "ia" };
}
