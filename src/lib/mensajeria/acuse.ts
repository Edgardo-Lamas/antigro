/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL ACUSE DE RECIBO — «Lo vi»
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  **Lo planteó Edgardo el 16/8:** *"tenemos que crear un método que confirme
 *  que el padre recibió el alerta, y si no lo recibió actuar de alguna manera…
 *  supongamos que al padre le robaron el celular, o que muy atareado lo dejó
 *  pasar"*.
 *
 *  🔴 **El agujero, y hasta hoy ni lo podíamos medir:** `entregado` significa
 *  que el transporte aceptó el mensaje. Telegram contestó `ok`. Teléfono
 *  robado, apagado, o la notificación deslizada sin leer: quedaba registrado
 *  como entregado igual.
 *
 *  🔑 **Dice «Lo vi» y no «OK», y la diferencia importa.** «OK» se lee como
 *  *«está bien / estoy de acuerdo»*, y esto no es algo con lo que uno esté de
 *  acuerdo. «Lo vi» dice exactamente lo que el sistema aprende, ni un gramo
 *  más: que esa persona lo vio. **No que se haga cargo, no que vaya a hacer
 *  algo.** Elegido por Edgardo el 19/8.
 *
 *  🔴 **El chico NUNCA lleva botón, y eso es estructural, no un olvido.** Él no
 *  recibe una alerta para actuar: recibe orientación. Si su toque contara como
 *  acuse, el sistema se quedaría callado **porque lo vio la chica**, y eso da
 *  vuelta el producto entero. Por eso el token se genera sólo para
 *  `alerta_adultos` — no hay ninguna condición que alguien pueda invertir por
 *  error más adelante.
 */

import { randomUUID } from "node:crypto";

/** Lo que dice el botón. */
export const ETIQUETA_DEL_ACUSE = "Lo vi";

/**
 * 🔑 Prefijo del `callback_data`. Telegram lo topea en **64 bytes**, y con esto
 * quedan 61 para el token — de sobra para un UUID.
 */
const PREFIJO = "vi:";

/**
 * Un token nuevo. Impredecible a propósito: es una credencial, no un
 * identificador. Con uno adivinable, cualquiera cerraría el aviso de otra
 * familia sin haberlo visto nunca.
 */
export function nuevoTokenDeAcuse(): string {
  return randomUUID();
}

export function callbackDelAcuse(token: string): string {
  return `${PREFIJO}${token}`;
}

/** El token que viaja en un toque de botón, o `null` si el toque es otra cosa. */
export function tokenDeUnToque(callbackData: string | undefined | null): string | null {
  if (!callbackData || !callbackData.startsWith(PREFIJO)) return null;
  const token = callbackData.slice(PREFIJO.length).trim();
  return token.length > 0 ? token : null;
}

/* ── Quién vio el aviso ───────────────────────────────────────────────────── */

/**
 * Cuánto separa dos tandas de avisos.
 *
 * 🔑 Una tanda es UNA corrida de `avisar()`: todos los adultos reciben con
 * segundos de diferencia. Y no puede haber dos el mismo día para el mismo
 * destinatario — `yaSeAviso()` lo impide. Seis horas separa tandas de días
 * distintos sin partir nunca una sola.
 */
const HORAS_DE_UNA_TANDA = 6;

export interface QuienLoVio {
  /** Cada aviso mandado a un adulto, con su acuse o su ausencia. */
  avisos: {
    destino: string;
    nombre: string | null;
    /** 🔑 `true` sólo para progenitores y tutores. El referente no cierra. */
    esResponsable: boolean;
    fecha: string;
    entregado: boolean;
    acusadoEn: string | null;
  }[];
  /** Los avisos de la ÚLTIMA tanda. Es sobre éstos que se decide escalar. */
  ultimaTanda: QuienLoVio["avisos"];
  /**
   * 🔴 **La condición que frena la escalada, y la definió Edgardo el 19/8:**
   * *"el acuse es de uno de los responsables"*.
   *
   * 🔴 **Y se mira SÓLO sobre la última tanda, no sobre la ventana entera.**
   * Encontrado mirando el panel el 19/8: con el historial completo, un acuse de
   * hace dos días alcanzaba para decir *«un responsable lo vio»* mientras el
   * aviso de hoy seguía sin abrir. **Con eso la escalada no se disparaba nunca
   * más** una vez que alguien había acusado recibo alguna vez en su vida.
   * El acuse es de cada aviso, no de la persona para siempre.
   *
   * No se cuentan acuses, se mira si acusó **alguien que tiene la
   * responsabilidad**. Contar se rompe con un caso concreto: tres mensajes,
   * dos acuses, y que los dos sean el referente y el chico — ahí ningún
   * progenitor lo vio, que es exactamente el caso para el que existe la
   * escalada.
   *
   * 🔑 **Con UNO alcanza.** No es lista de asistencia: el aviso es para la
   * familia, y un responsable enterado ya es alguien mirando.
   */
  loVioUnResponsable: boolean;
  /**
   * ⚠ **«No acusó» y «nunca le llegó» NO son lo mismo**, y confundirlos haría
   * que la escalada se disparara por un problema de configuración disfrazado
   * de desatención. A quien le falta apretar «Iniciar» **el mensaje nunca le
   * salió**: la respuesta correcta no es una segunda oleada, es que el panel
   * diga que le falta un clic.
   */
  hayAvisosQueNoSalieron: boolean;
}

interface RespuestaMirada {
  clase: string;
  destino: string;
  fecha: string;
  entregado: boolean;
  acuseToken?: string | null;
  acusadoEn?: string | null;
}

interface AdultoMirado {
  nombre: string;
  rol: string;
  activo: boolean;
  canal: { destino: string };
}

/**
 * Junta lo que se mandó a los adultos con quiénes son, para poder decir quién
 * lo vio.
 *
 * 📌 El cruce es por `destino` —el chat de Telegram— porque una `Respuesta` se
 * guarda por destinatario y no por persona: la fila sabe adónde fue, no a
 * quién. Es la misma dirección que ya tiene el adulto en su canal.
 */
export function quienLoVio(
  respuestas: RespuestaMirada[],
  adultos: AdultoMirado[],
): QuienLoVio {
  const avisos = respuestas
    .filter((r) => r.clase === "alerta_adultos")
    .map((r) => {
      const adulto = adultos.find((a) => a.canal.destino && a.canal.destino === r.destino);
      return {
        destino: r.destino,
        nombre: adulto?.nombre ?? null,
        /* 🔑 Sólo progenitores y tutores. El referente recibe el aviso y su
           acuse se registra —saber que lo vio sirve, y va al informe— pero no
           cierra el circuito: no es el adulto con la responsabilidad. */
        esResponsable: adulto?.rol === "progenitor" && adulto.activo !== false,
        fecha: r.fecha,
        entregado: r.entregado,
        acusadoEn: r.acusadoEn ?? null,
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  /* 🔴 La última tanda: los avisos que salieron con el más reciente. Todo lo
     que se decide —escalar o no— se decide sobre éstos. */
  const masReciente = avisos[0];
  const corte = masReciente
    ? new Date(masReciente.fecha).getTime() - HORAS_DE_UNA_TANDA * 60 * 60 * 1000
    : 0;
  const ultimaTanda = avisos.filter((a) => new Date(a.fecha).getTime() >= corte);

  return {
    avisos,
    ultimaTanda,
    loVioUnResponsable: ultimaTanda.some((a) => a.esResponsable && a.acusadoEn !== null),
    hayAvisosQueNoSalieron: ultimaTanda.some((a) => !a.entregado),
  };
}
