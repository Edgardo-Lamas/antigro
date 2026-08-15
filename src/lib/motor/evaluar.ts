/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL MOTOR — la regla de persistencia
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 No se alerta por un evento. Se alerta por un patrón que se sostiene.
 *  📊 El 90% de las víctimas sufre acoso cotidiano, sostenido durante meses
 *     (Estudio nacional sobre acoso sexual a NNyA mediante TIC, 2023).
 *     Un pico aislado es ruido, y un sistema que grita por cada pico se apaga
 *     a la semana.
 *
 *  🔴 El motor NUNCA afirma que un chico está siendo acosado, ni que está a
 *  salvo. Devuelve qué se vio, cuánto hace que se sostiene, y qué NO puede ver.
 */

import type { SenalDeRed, TipoDeSenal } from "@/lib/senales/tipos";
import { NOMBRE_DE_SENAL } from "@/lib/senales/tipos";
import type { Chico } from "@/lib/datos/tipos";
import {
  MEDIA_VENTANA_DIAS,
  PESO_POR_TIPO,
  VENTANA_DIAS,
  factorEdad,
  factorGenero,
} from "./pesos";
import { evaluarObservaciones, type AporteDeLosAdultos } from "./cuestionario";

const DIA_MS = 24 * 60 * 60 * 1000;

/* ── Umbrales ────────────────────────────────────────────────────────────── */

/** Por debajo de esto, el día no cuenta como día con señal. Es vida normal. */
const CARGA_MINIMA_DIA = 0.25;

/**
 * 🔴 El corazón de la regla: cuántos días tiene que llevar el patrón antes de
 * que el sistema abra la boca. Ocho días no es un número mágico; es lo que
 * separa "una semana rara" de "esto viene pasando".
 */
const DIAS_SOSTENIDOS_MINIMOS = 8;

/** Una racha tolera un día de silencio sin cortarse. Dos, no. */
const HUECO_TOLERADO = 1;

/** La evasión repetida tiene camino propio: es la señal más fuerte que hay. */
const EVASIONES_PARA_HABLAR = 2;

/**
 * ⚠ El umbral de "hay un cambio" es bajo a propósito, y se puede permitir
 * serlo: ese estado **no le escribe a nadie**. Es lo que el sistema está
 * mirando, no lo que dice. El umbral que importa es el de abajo.
 */
const PUNTAJE_PARA_ATENCION = 0.2;
const PUNTAJE_PARA_HABLAR = 0.45;

/**
 * Techo del aporte de los adultos. No llega a 1 a propósito: el cuestionario
 * es una impresión, no una medición, y no puede disparar solo una alerta.
 */
const APORTE_MAXIMO_ADULTOS = 0.7;

/** A partir de acá se considera que las dos entradas están coincidiendo. */
const COINCIDENCIA_FUERTE = 0.55;

/* ── Estado ──────────────────────────────────────────────────────────────── */

export type Estado = "en_calma" | "atencion" | "patron_sostenido";

export const NOMBRE_DE_ESTADO: Record<Estado, string> = {
  en_calma: "Sin novedad",
  atencion: "Hay un cambio",
  patron_sostenido: "El patrón se sostiene",
};

export interface DiaDeLaVentana {
  /** `YYYY-MM-DD` en hora local. */
  dia: string;
  /** 0 a 1 — cuánto se apartó ese día de lo habitual. */
  carga: number;
  tipos: TipoDeSenal[];
}

export interface Lectura {
  estado: Estado;
  /** 0 a 1 — las dos entradas ya combinadas. */
  puntaje: number;
  /** Sólo lo que vio la red, para poder mostrar cada entrada por separado. */
  puntajeRed: number;
  /** Lo que aportaron los adultos. */
  adultos: AporteDeLosAdultos;
  dias: DiaDeLaVentana[];
  diasConSenal: number;
  /** Hace cuántos días viene sosteniéndose, sin cortarse. */
  diasSostenidos: number;
  /** Media reciente menos media anterior. Positivo = se está profundizando. */
  tendencia: number;
  evasionesRecientes: number;
  /** Los ids de las señales que la sostienen. Sin esto, no se afirma. */
  senalesQueLaSostienen: string[];
  /** Por qué el sistema dice lo que dice, sin adornos. */
  porQue: string[];
  /** 🔴 Qué NO se puede saber desde acá. Va siempre, sobre todo cuando alerta. */
  loQueNoSeVe: string[];
}

/* ── Utilidades ──────────────────────────────────────────────────────────── */

/** `YYYY-MM-DD` local — en UTC, una señal de las 22 caería al día siguiente. */
export function diaLocal(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const mes = `${d.getMonth() + 1}`.padStart(2, "0");
  const dia = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Carga de un día: se combinan las señales como probabilidades, no sumando.
 * Tres señales flojas no equivalen a una fuerte, y sumar haría que sí.
 */
function cargaDelDia(senales: SenalDeRed[]): number {
  const restante = senales.reduce(
    (acc, s) => acc * (1 - Math.min(1, s.intensidad * PESO_POR_TIPO[s.tipo])),
    1,
  );
  return 1 - restante;
}

/** Racha de días con carga, contando hacia atrás desde el final de la ventana. */
function rachaSostenida(dias: DiaDeLaVentana[]): number {
  let racha = 0;
  let hueco = 0;

  for (let i = dias.length - 1; i >= 0; i--) {
    if (dias[i].carga >= CARGA_MINIMA_DIA) {
      racha += hueco + 1;
      hueco = 0;
    } else if (racha > 0 && hueco < HUECO_TOLERADO) {
      hueco++;
    } else {
      break;
    }
  }
  return racha;
}

/* ── La evaluación ───────────────────────────────────────────────────────── */

export interface Consulta {
  chico: Pick<Chico, "edad" | "genero">;
  senales: SenalDeRed[];
  /** Hasta qué momento se mira. Moverlo es lo que hace el reloj acelerado. */
  hasta: Date;
  /** Lo último que contestaron los adultos. Sin esto, el motor mira con un ojo. */
  observaciones?: Record<string, number>;
}

export function evaluar({ chico, senales, hasta, observaciones }: Consulta): Lectura {
  const inicio = new Date(hasta.getTime() - (VENTANA_DIAS - 1) * DIA_MS);

  /* Un casillero por día, incluso los días sin nada: los silencios son parte
     del patrón tanto como los picos. */
  const dias: DiaDeLaVentana[] = [];
  const porDia = new Map<string, SenalDeRed[]>();

  for (const s of senales) {
    const f = new Date(s.fecha);
    if (f < inicio || f > hasta) continue;
    const clave = diaLocal(f);
    porDia.set(clave, [...(porDia.get(clave) ?? []), s]);
  }

  for (let i = 0; i < VENTANA_DIAS; i++) {
    const fecha = new Date(inicio.getTime() + i * DIA_MS);
    const clave = diaLocal(fecha);
    const delDia = porDia.get(clave) ?? [];
    dias.push({
      dia: clave,
      carga: cargaDelDia(delDia),
      tipos: [...new Set(delDia.map((s) => s.tipo))],
    });
  }

  const conSenal = dias.filter((d) => d.carga >= CARGA_MINIMA_DIA);
  const diasSostenidos = rachaSostenida(dias);

  /* Tendencia: la mitad reciente contra la anterior. */
  const recientes = dias.slice(-MEDIA_VENTANA_DIAS);
  const previos = dias.slice(-MEDIA_VENTANA_DIAS * 2, -MEDIA_VENTANA_DIAS);
  const media = (xs: DiaDeLaVentana[]) =>
    xs.length === 0 ? 0 : xs.reduce((a, d) => a + d.carga, 0) / xs.length;
  const tendencia = media(recientes) - media(previos);

  /* Evasión reciente: camino propio. */
  const desdeEvasion = new Date(hasta.getTime() - MEDIA_VENTANA_DIAS * DIA_MS);
  const evasiones = senales.filter(
    (s) => s.tipo === "evasion" && new Date(s.fecha) >= desdeEvasion && new Date(s.fecha) <= hasta,
  );

  /* Lo que ve la red, ajustado por edad y género. */
  const ajuste = factorEdad(chico.edad) * factorGenero(chico.genero);
  const puntajeRed = Math.min(1, media(recientes) * ajuste);

  /* Lo que ven los adultos — la segunda entrada. */
  const adultos = evaluarObservaciones(observaciones ?? {});

  /**
   * Las dos entradas se combinan como probabilidades, no promediando: una
   * entrada floja no puede bajar a la otra. Si la red no vio nada, el aporte
   * de los adultos sigue contando; si los adultos no contestaron, la red
   * sigue contando sola.
   */
  const puntaje = 1 - (1 - puntajeRed) * (1 - adultos.puntaje * APORTE_MAXIMO_ADULTOS);

  /**
   * 🔑 Acá está la tesis del producto. Cuando dos entradas independientes
   * coinciden, hace falta menos evidencia de una sola: si los adultos ya
   * están viendo cambios, no tiene sentido esperar los ocho días completos
   * para decírselo. Nunca baja de cuatro días: la persistencia sigue mandando.
   */
  const diasExigidos =
    adultos.puntaje >= COINCIDENCIA_FUERTE
      ? Math.max(4, DIAS_SOSTENIDOS_MINIMOS - 3)
      : DIAS_SOSTENIDOS_MINIMOS;

  /* ── El estado. La persistencia manda: sin racha no se habla. ── */
  let estado: Estado = "en_calma";

  if (evasiones.length >= EVASIONES_PARA_HABLAR) {
    estado = "patron_sostenido";
  } else if (diasSostenidos >= diasExigidos && puntaje >= PUNTAJE_PARA_HABLAR) {
    estado = "patron_sostenido";
  } else if (conSenal.length >= 2 && puntaje >= PUNTAJE_PARA_ATENCION) {
    estado = "atencion";
  }

  /**
   * 🔴 Si los adultos están marcando cosas y la red no vio nada, el sistema
   * NO se queda callado: lo que cuenta un adulto no necesita que una red lo
   * confirme para merecer una conversación. Pero tampoco sube a "patrón
   * sostenido" — eso lo tiene que sostener el registro, no una impresión.
   */
  const soloLosAdultos = estado === "en_calma" && adultos.puntaje >= COINCIDENCIA_FUERTE;
  if (soloLosAdultos) estado = "atencion";

  /* ── Por qué ── */
  const porQue: string[] = [];

  if (soloLosAdultos) {
    porQue.push(
      "Esto no sale de la red: la red no vio nada fuera de lo habitual. " +
        "Sale de lo que están marcando los adultos, y con eso alcanza para hablar con el chico.",
    );
  } else if (estado === "en_calma") {
    porQue.push(
      conSenal.length === 0
        ? "No hubo ningún día fuera de lo habitual en estas tres semanas."
        : `Hubo ${conSenal.length} día${conSenal.length === 1 ? "" : "s"} distinto${
            conSenal.length === 1 ? "" : "s"
          }, sin repetirse. Un pico aislado es ruido.`,
    );
  } else {
    porQue.push(
      `${conSenal.length} de los últimos ${VENTANA_DIAS} días quedaron fuera de lo habitual.`,
    );
    if (diasSostenidos > 0) {
      porQue.push(
        diasSostenidos >= DIAS_SOSTENIDOS_MINIMOS
          ? `Viene sosteniéndose hace ${diasSostenidos} días seguidos.`
          : `Lleva ${diasSostenidos} día${diasSostenidos === 1 ? "" : "s"} seguido${
              diasSostenidos === 1 ? "" : "s"
            }: todavía no alcanza para hablar de patrón.`,
      );
    }
    if (tendencia > 0.05) porQue.push("La última semana fue más marcada que la anterior.");
  }

  if (evasiones.length > 0) {
    porQue.push(
      `Hubo ${evasiones.length} intento${evasiones.length === 1 ? "" : "s"} de saltar el filtro ` +
        `en la última semana. Es la señal más fuerte que puede ver una red.`,
    );
  }

  const tipos = [...new Set(conSenal.flatMap((d) => d.tipos))];
  if (tipos.length > 0) {
    porQue.push(`Lo que se repitió: ${tipos.map((t) => NOMBRE_DE_SENAL[t].toLowerCase()).join(", ")}.`);
  }

  /* La segunda entrada, dicha por separado: son dos miradas, no una. */
  if (adultos.respondidas === 0) {
    porQue.push(
      "Nadie contestó el cuestionario todavía. Esto es sólo lo que ve la red, con un ojo de los dos.",
    );
  } else {
    if (adultos.loQueMasPeso.length > 0) {
      porQue.push(`Lo que marcaron los adultos: ${adultos.loQueMasPeso.join(" · ")}`);
    }
    if (adultos.puntaje >= COINCIDENCIA_FUERTE && diasSostenidos > 0) {
      porQue.push(
        "Lo que ve la red y lo que ven los adultos están apuntando a lo mismo. " +
          "Cuando eso pasa, el sistema no espera a tener toda la evidencia de un solo lado.",
      );
    }
  }

  /* ── 🔴 Lo que no se ve. Va siempre. ── */
  const loQueNoSeVe = [
    "No se leyó ni se guardó nada de lo que escribió. El sistema ve horarios y volúmenes, no conversaciones.",
    "El 74,3% de los casos pasa por WhatsApp, que va cifrado: nada de eso aparece acá.",
    "Esto no dice que esté pasando algo. Dice que hay un cambio que se sostuvo y que conviene mirar.",
  ];

  return {
    estado,
    puntaje,
    puntajeRed,
    adultos,
    dias,
    diasConSenal: conSenal.length,
    diasSostenidos,
    tendencia,
    evasionesRecientes: evasiones.length,
    senalesQueLaSostienen: senales
      .filter((s) => {
        const clave = diaLocal(new Date(s.fecha));
        return conSenal.some((d) => d.dia === clave);
      })
      .map((s) => s.id),
    porQue,
    loQueNoSeVe,
  };
}
