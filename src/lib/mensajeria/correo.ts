/**
 * Transporte: correo, por Brevo o por Resend.
 *
 * Sirve para los adultos; para el chico casi siempre va a ser Telegram, que es
 * donde está.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔑 BREVO PRIMERO — 24/9, para poder recuperar la contraseña
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  AntiGro no tiene dominio propio, y sin dominio Resend sólo le escribe a la
 *  casilla dueña de la cuenta (abajo). Brevo, en su plan gratis, manda hasta
 *  300 correos por día sin dominio propio: alcanza con verificar un correo
 *  remitente. Lo decidió Edgardo el 24/9 para la versión beta del concurso
 *  (antes se había pensado en una cuenta de Gmail, y quedó descartada).
 *
 *  Con `CORREO_BREVO_USUARIO`, `CORREO_BREVO_CLAVE` y `CORREO_BREVO_REMITENTE`
 *  en el entorno, sale por el servidor SMTP de Brevo. Si no, sigue la regla de
 *  Resend de siempre. 📌 El día que haya dominio, se autentica en Brevo y los
 *  correos dejan de salir con el dominio prestado: nada de lo que usa este
 *  transporte se entera.
 *
 *  ⚠ Los tres datos salen del panel de Brevo, en «SMTP y API»:
 *    - USUARIO es el «login SMTP» (del tipo `xxx@smtp-brevo.com`), NO el correo
 *      con el que se entra a Brevo.
 *    - CLAVE es una «clave SMTP» generada ahí, NO la contraseña de la cuenta.
 *    - REMITENTE es un correo verificado en «Remitentes»: el que ve la familia.
 *  ⚠ Sin dominio propio, Brevo reescribe el remitente con un dominio suyo
 *  (`brevosend.com`) para cumplir las reglas de Gmail y Yahoo. Llega igual; es
 *  más probable que caiga en correo no deseado, y la pantalla ya pide mirar ahí.
 */

import nodemailer from "nodemailer";
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

/** La cuenta de Brevo de AntiGro, si está configurada. */
function cuentaDeBrevo(): { usuario: string; clave: string; remitente: string } | null {
  const usuario = process.env.CORREO_BREVO_USUARIO?.trim();
  const clave = process.env.CORREO_BREVO_CLAVE?.trim();
  const remitente = process.env.CORREO_BREVO_REMITENTE?.trim();
  return usuario && clave && remitente ? { usuario, clave, remitente } : null;
}

export class TransporteCorreo implements Transporte {
  readonly canal = "correo" as const;

  get nombre() {
    return cuentaDeBrevo() ? "Correo (Brevo)" : "Correo (Resend)";
  }

  private get apiKey() {
    return process.env.RESEND_API_KEY ?? "";
  }

  async estado(): Promise<EstadoDeTransporte> {
    const brevo = cuentaDeBrevo();
    if (brevo) return { disponible: true, detalle: brevo.remitente };
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
    const brevo = cuentaDeBrevo();
    if (brevo) return this.porBrevo(brevo, envio);

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

  private async porBrevo(
    cuenta: { usuario: string; clave: string; remitente: string },
    envio: Envio,
  ): Promise<ResultadoDeEnvio> {
    try {
      /* 587 con STARTTLS: el canal va cifrado aunque arranque en claro. */
      const transporte = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: cuenta.usuario, pass: cuenta.clave },
      });
      await transporte.sendMail({
        from: { name: "AntiGro", address: cuenta.remitente },
        to: envio.destino,
        subject: envio.asunto ?? "AntiGro",
        // Texto plano a propósito: es un aviso, no una pieza de marketing.
        text: envio.texto,
      });
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
