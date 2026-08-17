/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL LÍMITE DE FRECUENCIA — escrito el 2026-08-17, salió de la auditoría
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **Hasta el 17/8 no había ninguno, en ningún lado.** Y el sistema tiene
 *  llamadas a Opus 5 colgadas de rutas que cualquiera puede pegar: cada texto
 *  que se redacta y cada respuesta del asistente cuestan plata de verdad.
 *
 *  🔑 **Vive en la base, no en memoria, y no es una preferencia.** En Vercel
 *  cada ruta de API es una función distinta con su propia memoria: un contador
 *  en un módulo sería el contador de esa instancia, y el límite sería «tantos
 *  pedidos por instancia», que no limita nada. Es la MISMA trampa que ya nos
 *  comimos con el repositorio (14/8) y con el cupo del QR (16/8). Tercera vez:
 *  **si dos pedidos tienen que ver el mismo número, el número no vive en
 *  memoria.**
 *
 *  🔴 **Deja pasar cuando la base no está, y hay que saberlo.** Sin Supabase el
 *  sistema entero corre en modo demo y tiene que andar igual —son 25 puntos—,
 *  así que acá no se puede cerrar la puerta. Pero un límite que falla en
 *  silencio es peor que no tenerlo: por eso `motivo` dice por qué dejó pasar, y
 *  quien llama lo publica en la respuesta. Que se vea.
 */

import { baseDeDatos } from "@/lib/supabase";

export interface Turno {
  permitido: boolean;
  /** Cuántos pedidos quedan en la ventana en curso. */
  restantes: number;
  /** En cuántos segundos se libera. 0 si no hay espera. */
  esperaSeg: number;
  /** Por qué dejó pasar sin contar, cuando pasó eso. */
  motivo?: "sin_base" | "falla";
}

const SIN_LIMITE = (motivo: Turno["motivo"]): Turno => ({
  permitido: true,
  restantes: 0,
  esperaSeg: 0,
  motivo,
});

/**
 * ¿Pasa este pedido?
 *
 * @param clave     Qué se limita y a quién: `demo:<ip>`, `asistente:<adultoId>`.
 * @param ventanaSeg Largo de la ventana.
 * @param tope      Cuántos pedidos entran en esa ventana.
 */
export async function tomarTurno(
  clave: string,
  ventanaSeg: number,
  tope: number,
): Promise<Turno> {
  const db = baseDeDatos();
  if (!db) return SIN_LIMITE("sin_base");

  const { data, error } = await db.rpc("tomar_turno", {
    p_clave: clave,
    p_ventana_seg: ventanaSeg,
    p_tope: tope,
  });

  /* 🔴 Si la función no está aplicada todavía, esto entra por acá y deja pasar.
     Es lo correcto —tirar abajo el asistente porque falta una migración sería
     cambiar un problema de plata por uno de producto—, pero no puede pasar
     callado: queda en el registro y viaja en la respuesta. */
  if (error) {
    console.warn(`[limite] ${clave}: no se pudo contar (${error.message}). Se dejó pasar.`);
    return SIN_LIMITE("falla");
  }

  const fila = Array.isArray(data) ? data[0] : data;
  if (!fila) return SIN_LIMITE("falla");

  return {
    permitido: Boolean(fila.permitido),
    restantes: Number(fila.restantes ?? 0),
    esperaSeg: Number(fila.espera_seg ?? 0),
  };
}

/**
 * De quién viene el pedido, para los endpoints sin sesión.
 *
 * ⚠ **`x-forwarded-for` lo puede escribir el que llama**, así que esto no es
 * una identidad: es un agrupador. En Vercel la cabecera la reescribe el borde y
 * la primera dirección es la real, pero fuera de Vercel no hay garantía. Sirve
 * para que un visitante normal no gaste de más; no sirve para frenar a alguien
 * decidido a evitarlo — para eso está el cupo de tres del QR, que es el freno
 * de verdad de la demo.
 */
export function deQuienViene(req: Request): string {
  const reenviado = req.headers.get("x-forwarded-for");
  const primera = reenviado?.split(",")[0]?.trim();
  return primera || req.headers.get("x-real-ip") || "desconocido";
}
