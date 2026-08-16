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
import { esCruce, nombreDeLugar, puertaDe } from "@/lib/senales/plataformas";
import { NOMBRE_DE_SENAL } from "@/lib/senales/tipos";
import type { Chico } from "@/lib/datos/tipos";
import {
  CLASE_DE_SENAL,
  MEDIA_VENTANA_DIAS,
  PESO_POR_TIPO,
  VENTANA_DIAS,
  factorEdad,
  factorMadrugada,
  factorGenero,
} from "./pesos";
import {
  advertenciasDelPerfil,
  alcanceDeLaLectura,
  construirPerfil,
  type AlcanceDeLaLectura,
  type PerfilDelChico,
} from "./perfil";
import { evaluarObservaciones, type AporteDeLosAdultos } from "./cuestionario";
import { hastaDondeSeVio } from "./modus-operandi";

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
 * 🔴 **Medido el 15/8/2026, y sirve para no volver a equivocarse de perilla.**
 *
 * Al pasar del interruptor a la rampa de confianza, el escenario persistente
 * pasó a avisar el día 20 en vez del 17. La reacción intuitiva es bajar
 * `PUNTAJE_PARA_HABLAR`, y **es la perilla equivocada**: el día 17 el puntaje ya
 * es 0,478, o sea que pasa el umbral holgado. Lo que ata es `diasSostenidos`,
 * que ese día va 5 de los 8 que hacen falta.
 *
 * El motivo real es `CARGA_MINIMA_DIA`: con las señales relativas atenuadas, los
 * primeros días flojos de la escalada ya no llegan a 0,25 y no cuentan como
 * "día con señal", así que la racha arranca más tarde.
 *
 * 📌 **Y eso es el comportamiento correcto, no un defecto:** mientras el sistema
 * conoce poco al chico, una desviación floja no alcanza para contar un día en
 * contra. La racha empieza cuando la desviación es inequívoca. Si alguna vez se
 * decide que tres días es demasiado tarde, la perilla es ésta y no el umbral.
 */

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
  /** Lo que el sistema sabe de este chico. Se acumula, no vive en la ventana. */
  perfil: PerfilDelChico;
  /**
   * 🔑 Cuánto alcanzó a desplegarse la lectura, de 0 a 1. **No es cuánta
   * protección hay**: las señales absolutas funcionan desde el día uno y no
   * dependen de esto. Es cuánto pesa lo que se compara contra la historia del
   * propio chico, que es lo único que necesita conocerlo primero.
   */
  alcance: AlcanceDeLaLectura;
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
 *
 * 🔑 **Las señales relativas se atenúan por la confianza, no se apagan.** Decir
 * "saltó el volumen" sin saber cuál era su volumen habitual es inventar; pero
 * decir que no vale nada hasta un día fijo del calendario también lo es. Con
 * confianza 0,3 la señal cuenta un 30%: el sistema duda en voz baja en vez de
 * taparse los ojos.
 *
 * ⚠ Las **absolutas** (madrugada, evasión) no se tocan: valen desde el día uno,
 * porque no se comparan contra nada.
 */
function cargaDelDia(senales: SenalDeRed[], confianza: number, edad: number): number {
  const restante = senales.reduce((acc, s) => {
    const atenuacion = CLASE_DE_SENAL[s.tipo] === "relativa" ? confianza : 1;
    /* 🔑 La madrugada es absoluta, pero **se compara contra la EDAD**: a las 2
       de la mañana una nena de 9 y un pibe de 16 no son lo mismo. Ver
       `factorMadrugada` — se corre la hora de referencia, no se baja el peso. */
    const porEdad =
      s.tipo === "madrugada" ? factorMadrugada(edad, new Date(s.fecha).getHours()) : 1;
    const aporte = Math.min(1, s.intensidad * PESO_POR_TIPO[s.tipo] * atenuacion * porEdad);
    return acc * (1 - aporte);
  }, 1);
  return 1 - restante;
}

/**
 * Busca el cruce contacto abierto → requiere entrega dentro de la ventana. Ver el comentario
 * largo en el llamador: la señal es la secuencia, no el destino.
 *
 * Devuelve los nombres para poder decirlo en criollo, o `null` si no pasó.
 */
function detectarTraslado(
  senales: SenalDeRed[],
): { desde: string; hacia: string } | null {
  const lugares = senales
    .filter((s) => s.tipo === "plataforma_nueva" && typeof s.contexto?.dominio === "string")
    .map((s) => ({
      fecha: s.fecha,
      dominio: String(s.contexto!.dominio),
      puerta: puertaDe(String(s.contexto!.dominio)),
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const primerAbierto = lugares.find((l) => l.puerta === "contacto_abierto");
  if (!primerAbierto) return null;

  /* El destino tiene que aparecer DESPUÉS del lugar abierto: al revés no es un
     cruce. Que use WhatsApp desde antes no dice nada — lo que dice algo es que
     entregue su contacto después de conocer a alguien en un lugar abierto. */
  const posterior = lugares.find(
    (l) => l.fecha > primerAbierto.fecha && esCruce(primerAbierto.puerta, l.puerta),
  );
  if (!posterior) return null;

  return {
    desde: nombreDeLugar(primerAbierto.dominio),
    hacia: nombreDeLugar(posterior.dominio),
  };
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
  /**
   * 🔴 **Hace cuántos días el sistema mira a este chico. Sale del alta de la
   * familia, NO de las señales**, porque para una fuente de señales "no hubo
   * desviaciones" y "todavía no lo miramos" son indistinguibles: en los dos
   * casos no llega nada. Deducirlo de las señales hacía que un chico tranquilo
   * pareciera tener tres semanas de historia el primer día (bug del 15/8/2026).
   */
  diasObservados: number;
}

export function evaluar({ chico, senales, hasta, observaciones, diasObservados }: Consulta): Lectura {
  const inicio = new Date(hasta.getTime() - (VENTANA_DIAS - 1) * DIA_MS);

  /* Un casillero por día, incluso los días sin nada: los silencios son parte
     del patrón tanto como los picos. */
  const porDia = new Map<string, SenalDeRed[]>();
  let primeraFecha: Date | null = null;

  for (const s of senales) {
    const f = new Date(s.fecha);
    if (f > hasta) continue;
    if (!primeraFecha || f < primeraFecha) primeraFecha = f;
    const clave = diaLocal(f);
    porDia.set(clave, [...(porDia.get(clave) ?? []), s]);
  }

  /**
   * 🔑 **EL PERFIL SE ARMA CON TODA LA HISTORIA, NO CON LA VENTANA.**
   *
   * Esto es lo que separa las dos cosas que antes estaban mezcladas: el perfil
   * es lo que el sistema sabe del chico y no tiene tope; la ventana de abajo es
   * sólo el tramo reciente que se está evaluando, y existe para medir
   * persistencia. Si la fuente entrega seis meses, el perfil usa seis meses.
   *
   * La carga acá va **cruda** (sin atenuar): es la materia prima del perfil, y
   * atenuarla con el alcance que sale del propio perfil sería morderse la cola.
   */
  const arranque = primeraFecha ?? inicio;
  const historia: { dia: string; carga: number }[] = [];
  for (let t = new Date(diaLocal(arranque) + "T00:00:00").getTime(); t <= hasta.getTime(); t += DIA_MS) {
    const clave = diaLocal(new Date(t));
    historia.push({ dia: clave, carga: cargaDelDia(porDia.get(clave) ?? [], 1, chico.edad) });
  }

  const perfil = construirPerfil(historia, diasObservados);
  const alcance = alcanceDeLaLectura(perfil);

  /* ── La ventana: sólo el tramo reciente, y sólo para medir persistencia ── */
  const claves: string[] = [];
  for (let i = 0; i < VENTANA_DIAS; i++) {
    claves.push(diaLocal(new Date(inicio.getTime() + i * DIA_MS)));
  }

  const dias: DiaDeLaVentana[] = claves.map((clave) => {
    const delDia = porDia.get(clave) ?? [];
    return {
      dia: clave,
      carga: cargaDelDia(delDia, alcance.valor, chico.edad),
      tipos: [...new Set(delDia.map((s) => s.tipo))],
    };
  });

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

  /**
   * 🔑 **EL TRASLADO — de un juego a la mensajería privada.**
   *
   * Idea de Edgardo (15/8/2026): *"el flujo de Roblox al celular ya te está
   * diciendo que pasaron a otra instancia"*. Y es lo único de todo el fenómeno
   * que un filtro de red puede ver sin leer nada: **no el sitio, la secuencia.**
   *
   * El patrón que describen los casos es empezar en un juego con chat y seguir
   * en WhatsApp o Discord, donde el control es menor. Ninguna lista negra sirve
   * acá —el destino es la app más usada del país—, pero el MOVIMIENTO entre
   * clases de lugar sí es observable.
   *
   * ⚠ Sola no dice casi nada: millones de chicos juegan y después chatean. Por
   * eso no suma puntaje por su cuenta — entra como contexto de una lectura que
   * ya se sostiene por otro lado. Es exactamente lo que decía Edgardo: *"cada uno
   * de estos datos, solos o sueltos, no dicen nada; pero juntándolos dicen
   * mucho"*.
   */
  const traslado = detectarTraslado(claves.flatMap((c) => porDia.get(c) ?? []));
  if (traslado) {
    porQue.push(
      `La actividad se corrió de ${traslado.desde}, donde cualquiera puede escribirle, a ` +
        `${traslado.hacia}, donde hace falta que él haya entregado su contacto. Dicho sin ` +
        "vueltas: le dio su número o su usuario a alguien que conoció en un lugar abierto. " +
        "Por sí solo no significa nada —todos los chicos hacen eso— pero acompaña a lo demás.",
    );
  }

  /**
   * 🔑 **HASTA DÓNDE SE VIO EL PROCESO — la parte de sabueso.**
   *
   * Idea de Edgardo: mirar también cómo actúa el acosador, no sólo al chico.
   * El grooming no es un evento: es una secuencia con etapas descritas y
   * validadas (Sexual Grooming Model — ver `modus-operandi.ts`), y una secuencia
   * se puede reconocer a mitad de camino. Eso es anticipar en vez de constatar.
   *
   * ⚠ **No es un diagnóstico y no suma puntaje.** Que la huella esté no prueba
   * que la etapa ocurrió. Ordena el relato de la alerta; no la decide.
   */
  const etapa = hastaDondeSeVio(tipos);
  if (etapa && estado !== "en_calma") {
    porQue.push(
      `Lo que se ve encaja con una etapa descrita del proceso: ${etapa.nombre.toLowerCase()} — ` +
        `${etapa.queHace} ⚠ Que la huella esté no prueba que eso esté pasando; es la forma que ` +
        "tendría si estuviera pasando.",
    );
  }

  /**
   * 🔴 **Acá se le contesta al padre la pregunta difícil, y sin un número
   * inventado.** Antes esto decía "lleva 9 de los 14 días que necesita", que era
   * indefendible: no hay 14 días que sirvan para todos los chicos. Ahora dice
   * cuánto conoce a SU hijo y por qué.
   */
  if (alcance.valor < 0.85) {
    const quien = chico.edad >= 14 ? "él o ella" : "este chico";
    porQue.push(
      `La protección está desde el primer día, pero todavía se está desplegando: el sistema ` +
        `lleva ${perfil.diasObservados} día${perfil.diasObservados === 1 ? "" : "s"} conociendo a ` +
        `${quien}, y con eso pesa lo que compara contra su propia conducta previa. ` +
        "No espera una cantidad fija de días: va viendo más a medida que lo conoce.",
    );
    /* 🔴 Acá decía que la madrugada "desordena el descanso por sí sola". Lo
       corrigió Edgardo el 16/8 y tenía razón: **el sistema no sabe a qué hora
       se levanta ese chico.** Puede estar de vacaciones, o ir al turno tarde y
       dormir hasta el mediodía; en los dos casos descansó bien. Afirmar el
       descanso era afirmar algo que no se ve — la misma familia de error que
       el "volumen de mensajes" del 14/8.

       🔑 El motivo verdadero por el que estas dos valen desde el día uno es
       otro, y es más fuerte: **no se comparan contra la historia del chico.**
       La evasión porque es un acto deliberado; la madrugada porque se compara
       contra la EDAD (ver `factorMadrugada`). Y eso importa justamente cuando
       el chico ya venía siendo acosado antes del alta: ahí su historia trae el
       problema adentro y una lectura que sólo mire cambios no lo ve nunca. */
    porQue.push(
      "Lo que sí mira desde el primer día, sin depender de nada de esto: la actividad en horarios " +
        "que para su edad son de madrugada, y los intentos de saltar el filtro. Ninguna de las dos " +
        "se compara contra su historia, así que valen igual desde el primer día.",
    );
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

  /**
   * ── 🔴 Lo que no se ve. Va siempre, sobre todo cuando alerta. ──
   *
   * 🔑 Las advertencias del perfil entran acá y no en `porQue` por una razón:
   * `porQue` explica lo que el sistema afirma, y esto es lo contrario — es lo
   * que el sistema **no puede** afirmar. De Edgardo: *"el acosador se esconde y
   * sólo podemos ver/imaginar sus consecuencias"*.
   */
  /**
   * 🔴 El cierre depende del estado. Estaba fijo, y en calma decía «hay un
   * cambio que se sostuvo» sobre una lectura donde no hubo ningún cambio: el
   * sistema se contradecía a sí mismo en la misma pantalla.
   *
   * ⚠ El de calma **no dice que el chico esté a salvo** (regla 1). Dice qué
   * fue lo que no apareció, que es lo único que el sistema puede sostener.
   */
  const cierre: Record<Estado, string> = {
    en_calma:
      "Esto no dice que el chico esté a salvo. Dice que en este tramo no apareció nada que se " +
      "apartara de lo habitual en él, con las dos señales que la red alcanza a ver.",
    atencion:
      "Esto no dice que esté pasando algo. Dice que apareció un cambio y que conviene mirar.",
    patron_sostenido:
      "Esto no dice que esté pasando algo. Dice que hay un cambio que se sostuvo y que conviene mirar.",
  };

  /**
   * 🔴 **El horario del chico, que el sistema no conoce. Lo trajo Edgardo el
   * 16/8 y desarmó una afirmación que veníamos haciendo mal.**
   *
   * El sistema ve la hora de la actividad y nada más. No sabe si el chico está
   * de vacaciones, si entra al colegio a las 7 o si va al turno tarde y duerme
   * hasta el mediodía. Con el mismo dato de las 2 de la mañana, en un caso el
   * chico durmió ocho horas y en el otro se levantó a las 6.
   *
   * Va sólo cuando hubo madrugada: decirlo siempre sería ruido, y una lista de
   * límites que nadie lee no protege a nadie.
   */
  const huboMadrugada = senales.some((s) => s.tipo === "madrugada");

  const loQueNoSeVe = [
    "No se leyó ni se guardó nada de lo que escribió. El sistema ve horarios y volúmenes, no conversaciones.",
    "El 74,3% de los casos pasa por WhatsApp, que va cifrado: nada de eso aparece acá.",
    ...(huboMadrugada
      ? [
          "El sistema ve a qué hora hubo actividad, pero no conoce los horarios de esta casa: no " +
            "sabe si está de vacaciones, si entra al colegio a la mañana o si va al turno tarde. " +
            "Que haya habido actividad tarde no dice, por sí solo, que haya descansado mal.",
        ]
      : []),
    ...advertenciasDelPerfil(perfil, hasta),
    cierre[estado],
  ];

  return {
    estado,
    puntaje,
    perfil,
    alcance,
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
