/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA ESCALADA — qué hace el sistema cuando el aviso no lo vio nadie
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **La planteó Edgardo el 16/8:** *"si no hubo respuesta el sistema debería
 *  activar una segunda línea de alertas"*. La política se decidió ahí mismo y
 *  no se vuelve a discutir acá:
 *
 *  🔑 **Es la regla 5 aplicada a la insistencia.** *No se alerta por un evento,
 *  se alerta por persistencia* — y lo mismo vale para volver a golpear. Si el
 *  patrón se sigue sosteniendo, la razón para insistir sigue viva. **Si el
 *  patrón se cortó, NO se escala**, aunque nadie haya acusado recibo:
 *  perseguir a un padre por un aviso que ya no tiene sustento es exactamente
 *  cómo un sistema se gana el silenciado.
 *
 *  🔑 **Hay dos relojes y mezclarlos es la trampa.** El de *«¿lo vieron?»* corre
 *  en HORAS y sólo dispara la pregunta; el de *«¿sigue pasando?»* corre en DÍAS
 *  y es del que cuelga la decisión. Acá están separados a propósito.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  🔴 **QUÉ ES LA «SEGUNDA LÍNEA» — corregido el 19/8, y no es lo que decía la
 *  nota del 16.**
 *
 *  Esa nota proponía tres destinatarios nuevos: el otro canal de la persona,
 *  el otro adulto, y el referente. **Dos de los tres no existen**, y se ve
 *  mirando el código: `avisar()` recorre `adultos` entero, así que **el aviso
 *  original ya salió a TODOS** — progenitores y referente incluidos.
 *
 *  ➡ **La escalada no suma destinatarios, porque no queda ninguno por sumar.**
 *  Lo que suma es **información nueva**: que el primer aviso no lo abrió nadie
 *  y que el patrón siguió igual. Eso no es repetir: es otra cosa que decir.
 *
 *  🚫 **Y el referente NO recibe la escalada**, que es la parte menos obvia.
 *  Él ya recibió el aviso original y sabe que hay un patrón. Lo único que la
 *  escalada agregaría en su caso es *«los padres no lo vieron»* — y eso es
 *  información sobre los padres. Es exactamente la asimetría que Edgardo cerró
 *  el 18/8 cuando decidió que el referente no entra al panel. Ver «EL REFERENTE
 *  NO ENTRA» en el `CLAUDE.md`.
 *  ─────────────────────────────────────────────────────────────────────────
 *
 *  ⚠ **Toca una regla ya escrita, y es deliberado.** `avisar.ts` dice que no se
 *  repite el aviso, porque *"un sistema que manda la misma alerta todos los
 *  días se apaga solo"*. La escalada no la contradice: **manda un texto
 *  distinto, una sola vez por tanda, y sólo cuando hay algo nuevo que decir.**
 */

import type { Lectura } from "@/lib/motor";
import type { QuienLoVio } from "./acuse";

/**
 * Cuánto se espera antes de insistir.
 *
 * 📌 Ocho horas es una decisión de producto y se puede mover. El criterio: que
 * un aviso de la madrugada llegue a la mañana siguiente y uno de la tarde no
 * despierte a nadie a las tres.
 */
export const HORAS_PARA_ESCALAR = 8;

/**
 * 🔴 La excepción, y la marcó Edgardo: **la evasión del filtro**. Es la señal
 * más fuerte que tiene el sistema y es un **acto deliberado** — alguien
 * configuró algo para no ser visto. Un patrón sostenido con evasión y sin nadie
 * que lo haya abierto es el caso donde esperar ocho horas se siente mal.
 */
export const HORAS_CON_EVASION = 2;

export type MotivoDeLaDecision =
  /** Escala. */
  | "nadie_lo_vio_y_el_patron_sigue"
  /** 🔑 El más importante de los que NO escalan. La razón para insistir se murió. */
  | "el_patron_se_corto"
  | "lo_vio_un_responsable"
  | "no_hubo_aviso"
  | "todavia_es_temprano"
  /** ⚠ No es desatención: es un canal roto. Se dice en el panel, no se insiste. */
  | "ningun_aviso_salio"
  | "ya_se_escalo";

export interface DecisionDeEscalada {
  escala: boolean;
  motivo: MotivoDeLaDecision;
  /** Cuántas horas había que esperar en este caso. */
  esperaHoras: number;
  /** Cuántas pasaron desde el aviso. `null` si no hubo ninguno. */
  horasDesdeElAviso: number | null;
}

interface Entrada {
  lectura: Pick<Lectura, "estado" | "evasionesRecientes">;
  quienLoVio: QuienLoVio;
  /** Si ya se escaló por esta misma tanda. No se escala dos veces. */
  yaSeEscalo: boolean;
  ahora: Date;
}

/**
 * ¿Hay que insistir?
 *
 * 🔴 **El orden de las preguntas NO es indiferente y por eso está escrito así.**
 * Lo primero que se mira es si el patrón se cortó: si la razón para insistir se
 * murió, todo lo demás deja de importar — no hace falta saber si alguien lo vio
 * ni cuántas horas pasaron. Ponerlo después haría que el sistema calculara
 * esperas y silencios de un aviso que ya no tiene sustento.
 */
export function decidirEscalada({
  lectura,
  quienLoVio,
  yaSeEscalo,
  ahora,
}: Entrada): DecisionDeEscalada {
  const espera = lectura.evasionesRecientes > 0 ? HORAS_CON_EVASION : HORAS_PARA_ESCALAR;
  const tanda = quienLoVio.ultimaTanda;

  const masReciente = tanda.reduce<string | null>(
    (max, a) => (max === null || a.fecha > max ? a.fecha : max),
    null,
  );
  const horasDesdeElAviso =
    masReciente === null
      ? null
      : (ahora.getTime() - new Date(masReciente).getTime()) / (60 * 60 * 1000);

  const no = (motivo: MotivoDeLaDecision): DecisionDeEscalada => ({
    escala: false,
    motivo,
    esperaHoras: espera,
    horasDesdeElAviso,
  });

  /* 1 · 🔴 La razón para insistir. Va PRIMERA, ver arriba. */
  if (lectura.estado !== "patron_sostenido") return no("el_patron_se_corto");

  /* 2 · Sin aviso no hay nada que escalar. */
  if (tanda.length === 0) return no("no_hubo_aviso");

  /* 3 · 🔑 La regla de Edgardo (19/8): «el acuse es de uno de los responsables».
     No se cuentan acuses — se mira si acusó alguien con la responsabilidad. */
  if (quienLoVio.loVioUnResponsable) return no("lo_vio_un_responsable");

  /* 4 · ⚠ Si NINGUNO de los avisos salió, el silencio no es desatención: es un
     canal roto. Insistir por el mismo camino sería mandar otro mensaje al mismo
     lugar que ya rechazó el primero. Se dice en el panel. */
  if (!tanda.some((a) => a.entregado)) return no("ningun_aviso_salio");

  /* 5 · Una vez por tanda. Escalar de nuevo sobre el mismo aviso es repetir, y
     eso es justamente lo que `avisar()` no hace. */
  if (yaSeEscalo) return no("ya_se_escalo");

  /* 6 · El reloj de las horas, que es el que dispara la pregunta. */
  if (horasDesdeElAviso === null || horasDesdeElAviso < espera) {
    return no("todavia_es_temprano");
  }

  return {
    escala: true,
    motivo: "nadie_lo_vio_y_el_patron_sigue",
    esperaHoras: espera,
    horasDesdeElAviso,
  };
}

/* ── El texto ─────────────────────────────────────────────────────────────── */

/**
 * 🔴 **Determinista, y NO lo escribe el modelo.** Es la única salida del
 * sistema que no pasa por la IA, y por tres motivos que se refuerzan:
 *
 * 1. **No hay nada que interpretar.** Es un hecho de dos partes —nadie lo abrió,
 *    el patrón sigue— y el aviso original ya explicó qué está pasando.
 * 2. **Cuesta.** Cada texto generado son dos llamadas a Opus 5, y esto lo
 *    dispararía un reloj sin que nadie lo pida. Es exactamente la clase de
 *    gasto que encontró la auditoría del 17/8.
 * 3. **Es el peor momento para arriesgar.** Si el modelo se cae o el control lo
 *    frena, el respaldo saldría justo cuando el sistema está insistiendo porque
 *    nadie miró.
 *
 * 🔑 **Y no afirma nada nuevo** (regla 1): dice que se avisó, que nadie lo
 * abrió, y que lo que se veía se sigue viendo. Ni un diagnóstico ni un reproche.
 */
export function textoDeLaEscalada(
  chico: string,
  horasDesdeElAviso: number,
  conEvasion: boolean,
): string {
  const horas = Math.max(1, Math.round(horasDesdeElAviso));
  const cuando = horas === 1 ? "hace una hora" : `hace ${horas} horas`;

  return (
    `Te escribimos de nuevo por ${chico}.\n\n` +
    `El aviso que mandamos ${cuando} no lo abrió ninguno de los adultos ` +
    `responsables, y lo que veníamos viendo se sigue viendo igual.\n\n` +
    (conEvasion
      ? "Además apareció algo que conviene no dejar pasar: hubo intentos de " +
        "esquivar el filtro. Eso no pasa solo.\n\n"
      : "") +
    "No hace falta que hagas nada por acá: con abrir el panel alcanza. " +
    "Si el momento es malo, el aviso te va a estar esperando ahí.\n\n" +
    "Si algo te hace ruido y querés hablarlo con alguien, la Línea 137 atiende " +
    "las 24 horas."
  );
}
