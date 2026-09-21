/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QUE LA LISTA NO ENVEJEZCA — el refresco diario
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  El índice de categorías se arma **en cada compilación** (ver
 *  `scripts/construir-ut1.mjs`), así que sale al día con cada publicación. El
 *  problema es el mes tranquilo: **sin publicaciones, la lista envejece en
 *  silencio** y nadie se entera — que es la forma de falla que este proyecto
 *  viene persiguiendo desde el primero de sus errores.
 *
 *  🔑 **La solución es de una línea: que el reloj diario, si ve la lista vieja,
 *  pida una publicación nueva.** Vercel tiene *deploy hooks* justamente para
 *  eso: una dirección secreta que, llamada, dispara una compilación.
 *
 *  ─── 🔴 VIENE APAGADO, Y ES A PROPÓSITO ───────────────────────────────────
 *
 *  **Sin `DEPLOY_HOOK_UT1` en el entorno esto no hace absolutamente nada** y lo
 *  dice en la respuesta del reloj. Encenderlo significa **publicar a producción
 *  todos los días de forma automática**, y esa es una decisión de Edgardo, no
 *  del código: nadie debería descubrir que su producción se redespliega sola
 *  leyendo un archivo.
 *
 *  Para encenderlo, un solo paso: crear el *deploy hook* en Vercel (Ajustes →
 *  Git → Deploy Hooks, rama `main`) y pegar esa dirección en la variable de
 *  entorno `DEPLOY_HOOK_UT1`.
 */

import { estadoDelIndice } from "./categorias.ts";

/** Con más de esto encima, la lista se considera vieja. La fuente se actualiza a diario. */
export const HORAS_PARA_CONSIDERARLA_VIEJA = 36;

export interface ResultadoDelRefresco {
  /** `false` cuando no hay `DEPLOY_HOOK_UT1`: no es un error, es que está apagado. */
  encendido: boolean;
  /** Si se pidió una publicación nueva en esta corrida. */
  pidioPublicar: boolean;
  /** Horas que tiene encima la lista que está cargada, o `null` si no hay índice. */
  horas: number | null;
  detalle: string;
}

/**
 * Mira qué edad tiene la lista cargada y, si hace falta y está encendido, pide
 * una publicación nueva.
 *
 * ⚠ **Nunca tira.** Esto corre adentro del reloj, que tiene trabajo más
 * importante que hacer: que el refresco falle no puede voltear la corrida que
 * escala los avisos que nadie abrió.
 */
export async function refrescarLaLista(): Promise<ResultadoDelRefresco> {
  const estado = estadoDelIndice();
  const alDia = estado.alDia ? new Date(estado.alDia).getTime() : null;
  const horas = alDia ? Math.floor((Date.now() - alDia) / 3.6e6) : null;
  const hook = process.env.DEPLOY_HOOK_UT1;

  if (!hook) {
    return {
      encendido: false,
      pidioPublicar: false,
      horas,
      detalle:
        "El refresco automático está apagado (falta DEPLOY_HOOK_UT1). " +
        "La lista se renueva igual con cada publicación.",
    };
  }

  if (horas !== null && horas < HORAS_PARA_CONSIDERARLA_VIEJA) {
    return {
      encendido: true,
      pidioPublicar: false,
      horas,
      detalle: `La lista tiene ${horas} horas: todavía está fresca.`,
    };
  }

  try {
    const res = await fetch(hook, { method: "POST" });
    return {
      encendido: true,
      pidioPublicar: res.ok,
      horas,
      detalle: res.ok
        ? `La lista tenía ${horas ?? "?"} horas: se pidió una publicación nueva.`
        : `Se pidió publicar y Vercel contestó ${res.status}.`,
    };
  } catch (error) {
    return {
      encendido: true,
      pidioPublicar: false,
      horas,
      detalle: `No se pudo pedir la publicación: ${error instanceof Error ? error.message : error}`,
    };
  }
}
