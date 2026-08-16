/**
 * Transporte: correo, por Resend.
 *
 * Es el canal que hoy funciona de verdad. Sirve para los adultos; para el
 * chico casi siempre va a ser Telegram, que es donde está.
 */

import { Resend } from "resend";
import type { Envio, EstadoDeTransporte, ResultadoDeEnvio, Transporte } from "./tipos";

/**
 * 🔴 **Sin dominio propio verificado, Resend NO es un canal: es un sandbox.**
 * Con el remitente `onboarding@resend.dev` sólo se le puede escribir a la
 * casilla dueña de la cuenta — cualquier otro destinatario es rechazado.
 *
 * Por eso este transporte se reporta **no disponible** mientras falte el
 * dominio, aunque haya clave y aunque la clave sea válida. Decir "conectado"
 * acá sería exactamente lo que el sistema promete no hacer: fingir una entrega.
 * Y en una pantalla cuyo argumento es "nunca fingimos una entrega", es lo
 * primero que alguien va a pinchar.
 *
 * Para habilitarlo: verificar el dominio en Resend y completar
 * `CORREO_REMITENTE` con una dirección de ese dominio.
 */
const REMITENTE_SANDBOX = "AntiGro <onboarding@resend.dev>";
const REMITENTE = process.env.CORREO_REMITENTE?.trim() || REMITENTE_SANDBOX;

/** ¿El remitente es el de prueba de Resend, que sólo escribe a una casilla? */
function esSandbox(remitente: string): boolean {
  return /@resend\.dev>?\s*$/i.test(remitente.trim());
}

export class TransporteCorreo implements Transporte {
  readonly canal = "correo" as const;
  readonly nombre = "Correo (Resend)";

  private get apiKey() {
    return process.env.RESEND_API_KEY ?? "";
  }

  async estado(): Promise<EstadoDeTransporte> {
    if (!this.apiKey) return { disponible: false, motivo: "Falta RESEND_API_KEY" };
    if (esSandbox(REMITENTE)) {
      return {
        disponible: false,
        motivo:
          "La cuenta de Resend no tiene dominio verificado: sólo puede escribirle a la casilla " +
          "dueña de la cuenta. Falta CORREO_REMITENTE con un dominio propio.",
      };
    }
    return { disponible: true, detalle: REMITENTE };
  }

  async enviar(envio: Envio): Promise<ResultadoDeEnvio> {
    if (!this.apiKey) {
      return {
        transporte: this.nombre,
        entregado: false,
        ensayo: false,
        detalle: "Falta RESEND_API_KEY",
      };
    }

    try {
      const { error } = await new Resend(this.apiKey).emails.send({
        from: REMITENTE,
        to: envio.destino,
        subject: envio.asunto ?? "AntiGro",
        // Texto plano a propósito: es un aviso, no una pieza de marketing.
        text: envio.texto,
      });

      if (error) {
        return {
          transporte: this.nombre,
          entregado: false,
          ensayo: false,
          detalle: error.message,
        };
      }
      return { transporte: this.nombre, entregado: true, ensayo: false };
    } catch (e) {
      return {
        transporte: this.nombre,
        entregado: false,
        ensayo: false,
        detalle: e instanceof Error ? e.message : "Error al enviar el correo",
      };
    }
  }
}
