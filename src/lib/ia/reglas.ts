/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CONTROL — nada generado sale sin pasar por acá
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 Regla 1 del proyecto: el sistema NUNCA afirma que un chico está siendo
 * acosado, ni que está a salvo.
 *
 * Un prompt que pide no afirmar es una intención. Esto es una verificación:
 * si el texto no pasa, no se manda, y sale el de respaldo. La diferencia
 * entre las dos cosas es la que hace defendible al producto.
 */

import type { BandaDeEdad } from "@/lib/config";

export interface Veredicto {
  aprobado: boolean;
  motivos: string[];
}

/* ── 1. Afirmaciones prohibidas ──────────────────────────────────────────── */

/**
 * Las dos mitades de la regla 1. Afirmar que está a salvo es tan grave como
 * afirmar que lo están acosando: las dos le sacan al adulto la decisión de
 * mirar, y ninguna de las dos la puede sostener una señal de red.
 */
interface ReglaDeTexto {
  patron: RegExp;
  motivo: string;
  /**
   * Si la frase va negada, ¿está bien?
   *
   * ⚠ Esto no es un detalle: "no leemos lo que escribís" y "todavía no hay
   * nada confirmado" son exactamente lo que el sistema TIENE que decir, y una
   * regla ciega a la negación las frena. Pero "no estás a salvo" y "no está
   * siendo acosado" siguen prohibidas — negar una afirmación prohibida es
   * afirmar la otra mitad. Por eso la tolerancia va regla por regla.
   */
  negarLoHaceCorrecto: boolean;
}

const AFIRMACIONES_PROHIBIDAS: ReglaDeTexto[] = [
  {
    patron: /\b(est[áa]s?|fuiste|fue|son|es)\s+(siendo\s+)?(v[íi]ctima|acosad[oa]|groomead[oa])/i,
    motivo: "Afirma que hay acoso. El sistema señala, no diagnostica.",
    negarLoHaceCorrecto: false,
  },
  {
    patron: /\bte\s+est[áa]n?\s+(acosando|groomeando|manipulando)\b/i,
    motivo: "Afirma que hay acoso en curso.",
    negarLoHaceCorrecto: false,
  },
  {
    patron: /\b(est[áa]s?|est[áa]n)\s+(a\s+salvo|fuera\s+de\s+peligro|protegid[oa])\b/i,
    motivo: "Afirma que está a salvo. El sistema tampoco puede garantizar eso.",
    negarLoHaceCorrecto: false,
  },
  {
    patron: /\bno\s+(hay|existe)\s+(ning[úu]n\s+)?(peligro|riesgo)\b/i,
    motivo: "Descarta el riesgo, que es la otra mitad de la regla 1.",
    negarLoHaceCorrecto: false,
  },
  {
    patron: /\b(confirmad[oa]|comprobad[oa]|detectamos\s+que)\b/i,
    motivo: "Presenta como confirmado algo que es una señal.",
    negarLoHaceCorrecto: true,
  },
  {
    patron: /\b(le[íi]mos|leemos|ley[óo]|seg[úu]n\s+(tus|sus)\s+(mensajes|conversaciones|chats))\b/i,
    motivo: "🔴 Sugiere que se leyó contenido. El sistema no lee conversaciones.",
    negarLoHaceCorrecto: true,
  },
  {
    /* 🔴 Salió en el primer mensaje real, el 14/8: el modelo escribió "un salto
       en el volumen de MENSAJES". El sistema no ve mensajes — ve consultas de
       red, dominios y horarios. Contar mensajes implica verlos, y ahí se cae la
       regla 2 entera. La señal se llama "salto de volumen", sin complemento. */
    patron: /\b(volumen|cantidad|n[úu]mero)\s+de\s+(mensajes|chats|conversaciones)\b/i,
    motivo:
      "🔴 Atribuye al sistema ver mensajes. Ve volumen de actividad de red, no de mensajes.",
    negarLoHaceCorrecto: true,
  },
];

/** Palabras que dan vuelta el sentido, buscadas justo antes de la frase. */
const NEGACIONES = /\b(no|nunca|jam[áa]s|nada|ni|sin|tampoco|ning[úu]n[ao]?)\b/i;

/** Cuánto se mira hacia atrás para ver si la frase venía negada. */
const VENTANA_DE_NEGACION = 45;

function vaNegada(texto: string, indice: number): boolean {
  return NEGACIONES.test(texto.slice(Math.max(0, indice - VENTANA_DE_NEGACION), indice));
}

function infracciones(texto: string): string[] {
  const motivos: string[] = [];
  for (const regla of AFIRMACIONES_PROHIBIDAS) {
    const encontrado = regla.patron.exec(texto);
    if (!encontrado) continue;
    if (regla.negarLoHaceCorrecto && vaNegada(texto, encontrado.index)) continue;
    motivos.push(regla.motivo);
  }
  return motivos;
}

/* ── 2. Cifras ───────────────────────────────────────────────────────────── */

/**
 * Las únicas cifras que el sistema tiene derecho a decir, todas del estudio
 * nacional 2023. Cualquier otro porcentaje en un texto generado es un dato
 * inventado, y en este dominio un dato inventado hunde al producto entero.
 */
const CIFRAS_CITABLES = ["74,3", "74.3", "80", "56,4", "56.4", "35,4", "35.4", "63", "43", "60", "90", "40"];

function cifrasInventadas(texto: string): string[] {
  const encontradas = texto.match(/\b\d{1,3}(?:[.,]\d)?\s*%/g) ?? [];
  return encontradas
    .map((c) => c.replace(/\s*%/, "").trim())
    .filter((c) => !CIFRAS_CITABLES.includes(c));
}

/* ── 3. Derivación obligatoria por banda ─────────────────────────────────── */

/**
 * 📌 A los de 7 a 10 NO se les nombra la Línea 137: a esa edad la llama un
 * adulto. Nombrársela a un chico de 8 es darle una salida que no puede usar.
 */
const DERIVACION_EXIGIDA: Record<BandaDeEdad, RegExp[]> = {
  "7-10": [/\b(grande|adulto|mam[áa]|pap[áa]|casa)\b/i],
  "11-13": [/\b(adulto|grande)\b/i, /\b137\b/],
  "14-17": [/\b137\b/],
};

/* ── 4. Largo ────────────────────────────────────────────────────────────── */

/** Una idea por mensaje a los más chicos. Un texto largo a un chico de 8 no se lee. */
const LARGO_MAXIMO: Record<BandaDeEdad, number> = {
  "7-10": 320,
  "11-13": 600,
  "14-17": 800,
};

/* ── El control ──────────────────────────────────────────────────────────── */

export function revisarMensajeAlChico(texto: string, banda: BandaDeEdad): Veredicto {
  const motivos: string[] = infracciones(texto);

  const inventadas = cifrasInventadas(texto);
  if (inventadas.length > 0) {
    motivos.push(`Cifras sin fuente: ${inventadas.map((c) => `${c}%`).join(", ")}.`);
  }

  const faltantes = DERIVACION_EXIGIDA[banda].filter((p) => !p.test(texto));
  if (faltantes.length > 0) {
    motivos.push(`No deriva a donde corresponde para la banda ${banda}.`);
  }

  if (texto.length > LARGO_MAXIMO[banda]) {
    motivos.push(`Muy largo para la banda ${banda}: ${texto.length} de ${LARGO_MAXIMO[banda]}.`);
  }

  if (texto.trim().length < 40) {
    motivos.push("Demasiado corto para decir algo útil.");
  }

  return { aprobado: motivos.length === 0, motivos };
}

export function revisarLecturaParaAdultos(texto: string): Veredicto {
  const motivos: string[] = infracciones(texto);

  const inventadas = cifrasInventadas(texto);
  if (inventadas.length > 0) {
    motivos.push(`Cifras sin fuente: ${inventadas.map((c) => `${c}%`).join(", ")}.`);
  }

  if (texto.trim().length < 60) motivos.push("Demasiado corto.");
  if (texto.length > 1800) motivos.push(`Muy largo: ${texto.length} de 1800.`);

  return { aprobado: motivos.length === 0, motivos };
}
