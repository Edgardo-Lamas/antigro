/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TEXTOS DE RESPALDO — lo que se manda cuando la IA no está o no pasa el control
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 Esto no es un placeholder: es la garantía. Si mañana se cae la API de
 * Anthropic, se acaba la cuota o el modelo devuelve algo que no pasa las
 * reglas, el chico y los adultos igual reciben un mensaje correcto.
 *
 * Un sistema de protección infantil que se queda mudo porque falló un
 * proveedor no es un sistema de protección.
 *
 * Las bandas salen de los datos: el grueso de las víctimas está entre 11 y 15
 * años, con un segundo grupo importante entre 7 y 10 (estudio nacional 2023).
 */

import type { BandaDeEdad } from "@/lib/config";
import type { Estado } from "@/lib/motor";

export interface TextoParaElChico {
  /** El mensaje. Se manda tal cual. */
  texto: string;
  /** A quién se lo deriva, según la banda. */
  derivacion: string[];
}

/**
 * 7–10 · Corto y concreto. Una idea por mensaje, sin abstracciones.
 * Se deriva directo al adulto de confianza — a esta edad la Línea 137 la
 * llama un adulto, no el chico.
 */
const BANDA_7_10: Record<Exclude<Estado, "en_calma">, TextoParaElChico> = {
  atencion: {
    texto:
      "Hola. Si alguien que no conocés te escribe y te hace sentir raro, no es tu culpa. " +
      "Podés contarle a un grande de tu casa. No te va a pasar nada malo por contarlo.",
    derivacion: ["Contáselo a un adulto de tu casa."],
  },
  patron_sostenido: {
    texto:
      "Hola. Si alguien que no conocés te pide una foto, no tenés que contestarle. " +
      "No es tu culpa y no estás en problemas. Contáselo hoy a un grande de tu casa.",
    derivacion: ["Contáselo hoy a un adulto de tu casa."],
  },
};

/**
 * 11–13 · Se explica el mecanismo, no sólo la regla. Se nombra el grooming
 * como lo que es: un delito. Se le nombra la Línea 137.
 */
const BANDA_11_13: Record<Exclude<Estado, "en_calma">, TextoParaElChico> = {
  atencion: {
    texto:
      "Hola. Te escribimos por algo que quizás no sepas: hay adultos que se hacen pasar por " +
      "chicos para ganarse la confianza de alguien de tu edad. Se llama grooming y es un delito. " +
      "Si algo te está pasando, no hiciste nada malo.",
    derivacion: [
      "Contáselo a un adulto de confianza.",
      "Línea 137: gratis, las 24 horas, desde cualquier teléfono.",
    ],
  },
  patron_sostenido: {
    texto:
      "Hola. Hay adultos que se hacen pasar por chicos para ganarse la confianza de alguien de " +
      "tu edad, y después piden fotos o piden que no lo cuentes. Se llama grooming, es un delito " +
      "y le pasa a muchísima gente. Nada de esto es culpa tuya, ni siquiera si contestaste. " +
      "Contáselo hoy a alguien grande.",
    derivacion: [
      "Contáselo a un adulto de confianza.",
      "Línea 137: gratis, las 24 horas, desde cualquier teléfono.",
    ],
  },
};

/**
 * 14–17 · De igual a igual. Nada que suene a reto ni a control.
 * 📊 El 43% no habla de esto con sus padres: el mensaje no puede dar por
 * sentado que el adulto es la salida, por eso van las tres puertas.
 */
const BANDA_14_17: Record<Exclude<Estado, "en_calma">, TextoParaElChico> = {
  atencion: {
    texto:
      "Hola. Esto no es un reto ni un control. Si alguien que conociste por internet te está " +
      "pidiendo cosas que no querés dar, o te dice que no lo cuentes, eso tiene nombre: grooming, " +
      "y es un delito. Vos no hiciste nada mal. Tenés a quién recurrir, y podés elegir a quién.",
    derivacion: [
      "El adulto que vos elegiste cuando se dio de alta el sistema.",
      "Línea 137: gratis, las 24 horas, y no hace falta dar tu nombre.",
      "Se puede denunciar, y no necesitás tener pruebas para consultar.",
    ],
  },
  patron_sostenido: {
    texto:
      "Hola. Esto no es un reto ni un control, y no leímos nada de lo que escribiste. " +
      "Si alguien te está presionando para mandar fotos, para hablar a escondidas o para que no " +
      "lo cuentes, eso es grooming y es un delito — de la otra persona, nunca tuyo. Pasa mucho " +
      "más de lo que parece y casi nadie lo cuenta. Vos elegís a quién recurrir.",
    derivacion: [
      "El adulto que vos elegiste cuando se dio de alta el sistema.",
      "Línea 137: gratis, las 24 horas, y no hace falta dar tu nombre.",
      "Se puede denunciar, y no necesitás tener pruebas para consultar.",
    ],
  },
};

const POR_BANDA: Record<BandaDeEdad, Record<Exclude<Estado, "en_calma">, TextoParaElChico>> = {
  "7-10": BANDA_7_10,
  "11-13": BANDA_11_13,
  "14-17": BANDA_14_17,
};

export function respaldoParaElChico(
  banda: BandaDeEdad,
  estado: Estado,
): TextoParaElChico | null {
  // 🔴 En calma el sistema no le escribe. Un sistema que habla porque sí
  // deja de ser creíble justo el día que tiene algo para decir.
  if (estado === "en_calma") return null;
  return POR_BANDA[banda][estado];
}

/** La lectura para los adultos, armada con los datos del motor. */
export function respaldoParaLosAdultos(datos: {
  nombreDelChico: string;
  estado: Estado;
  porQue: string[];
  loQueNoSeVe: string[];
}): string {
  const encabezado =
    datos.estado === "patron_sostenido"
      ? `Hay un patrón que se sostiene en la actividad de red de ${datos.nombreDelChico}.`
      : `Hay un cambio en la actividad de red de ${datos.nombreDelChico}.`;

  return [
    encabezado,
    "",
    "Qué se vio:",
    ...datos.porQue.map((p) => `· ${p}`),
    "",
    "Qué NO dice esto:",
    ...datos.loQueNoSeVe.map((p) => `· ${p}`),
    "",
    datos.estado === "patron_sostenido"
      ? "Qué hacer ahora: hablar con él o ella, sin acusar y sin mostrarle esto como una prueba. " +
        "Si hace falta orientación, la Línea 137 atiende gratis las 24 horas."
      : "Qué hacer ahora: nada urgente. Vale la pena estar atento estos días.",
  ].join("\n");
}
