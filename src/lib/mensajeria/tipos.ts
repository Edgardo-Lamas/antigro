/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MENSAJERÍA — la capa que no sabe por dónde sale el mensaje
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔑 El sistema arma QUÉ decir y A QUIÉN. Por dónde sale es problema de acá.
 * Los canales los elige el cliente al contratar: Telegram, correo, WhatsApp.
 *
 * Mismo criterio que con las señales y el almacenamiento: hay una interfaz, y
 * cuando un transporte no está configurado el envío cae en **modo ensayo** —
 * se registra exactamente lo que se habría mandado, y se dice que no se mandó.
 * Nunca se finge una entrega.
 */

import type { CanalTipo } from "@/lib/datos/tipos";

export interface Envio {
  canal: CanalTipo;
  /** Chat de Telegram, dirección de correo o número. */
  destino: string;
  /** Sólo lo usa el correo. */
  asunto?: string;
  texto: string;
  /**
   * Si viene, el mensaje sale con el botón «Lo vi».
   *
   * 🔑 Lo decide quien manda, no el transporte: la orientación al chico nunca
   * lo lleva, y eso se resuelve en `avisar()` no generando el token. Un
   * transporte que no sepa dibujar botones lo ignora y manda el texto igual.
   */
  acuseToken?: string;
}

export interface ResultadoDeEnvio {
  /** Qué transporte lo tomó. */
  transporte: string;
  /** ¿Llegó de verdad? */
  entregado: boolean;
  /**
   * 🔴 true = no se mandó a nadie. Se registró lo que se habría mandado.
   * Esto se muestra en pantalla: un sistema que dice "enviado" cuando no
   * envió nada no sirve para nada.
   */
  ensayo: boolean;
  detalle?: string;
}

export type EstadoDeTransporte =
  | { disponible: true; detalle?: string }
  | { disponible: false; motivo: string };

/** La interfaz única de salida. */
export interface Transporte {
  readonly canal: CanalTipo;
  readonly nombre: string;
  estado(): Promise<EstadoDeTransporte>;
  enviar(envio: Envio): Promise<ResultadoDeEnvio>;
}
