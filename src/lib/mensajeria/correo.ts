/**
 * Transporte: correo, por Resend.
 *
 * Es el canal que hoy funciona de verdad. Sirve para los adultos; para el
 * chico casi siempre va a ser Telegram, que es donde está.
 */

import { Resend } from "resend";
import type { Envio, EstadoDeTransporte, ResultadoDeEnvio, Transporte } from "./tipos";

/**
 * ⚠ Mientras no haya dominio propio verificado en Resend, sólo se puede
 * enviar desde `onboarding@resend.dev`, y sólo a la casilla de la cuenta.
 * Para la demo alcanza; para producción hay que verificar el dominio.
 */
const REMITENTE = process.env.CORREO_REMITENTE ?? "AntiGro <onboarding@resend.dev>";

export class TransporteCorreo implements Transporte {
  readonly canal = "correo" as const;
  readonly nombre = "Correo (Resend)";

  private get apiKey() {
    return process.env.RESEND_API_KEY ?? "";
  }

  async estado(): Promise<EstadoDeTransporte> {
    if (!this.apiKey) return { disponible: false, motivo: "Falta RESEND_API_KEY" };
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
