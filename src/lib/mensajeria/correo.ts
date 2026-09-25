/**
 * Transporte: correo, por Gmail o por Resend.
 *
 * Sirve para los adultos; para el chico casi siempre va a ser Telegram, que es
 * donde está.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  🔑 GMAIL PRIMERO — 24/9, para poder recuperar la contraseña
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  AntiGro no tiene dominio propio, y sin dominio Resend sólo le escribe a la
 *  casilla dueña de la cuenta (abajo). Una cuenta de Gmail sólo de AntiGro, con
 *  una «contraseña de aplicación», manda hasta 500 correos por día sin dominio.
 *  Lo decidió Edgardo el 24/9: recuperar la clave no puede depender de que él
 *  esté atento a un pedido.
 *
 *  Con `CORREO_GMAIL_USUARIO` y `CORREO_GMAIL_CLAVE` en el entorno, sale por
 *  Gmail. Si no, sigue la regla de Resend de siempre. 📌 El día que haya
 *  dominio, se sacan esas dos variables y se completa `CORREO_REMITENTE`: nada
 *  de lo que usa este transporte se entera.
 *
 *  ⚠ `CORREO_GMAIL_CLAVE` NO es la contraseña de la cuenta: es la de 16 letras
 *  que Google genera en «Contraseñas de aplicaciones», y exige tener activada la
 *  verificación en dos pasos.
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

/** La cuenta de Gmail de AntiGro, si está configurada. */
function cuentaDeGmail(): { usuario: string; clave: string } | null {
  const usuario = process.env.CORREO_GMAIL_USUARIO?.trim();
  /* Google muestra la clave de aplicación en grupos de cuatro con espacios; se
     aceptan pegados o separados. */
  const clave = process.env.CORREO_GMAIL_CLAVE?.replace(/\s+/g, "");
  return usuario && clave ? { usuario, clave } : null;
}

export class TransporteCorreo implements Transporte {
  readonly canal = "correo" as const;

  get nombre() {
    return cuentaDeGmail() ? "Correo (Gmail)" : "Correo (Resend)";
  }

  private get apiKey() {
    return process.env.RESEND_API_KEY ?? "";
  }

  async estado(): Promise<EstadoDeTransporte> {
    const gmail = cuentaDeGmail();
    if (gmail) return { disponible: true, detalle: gmail.usuario };
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
    const gmail = cuentaDeGmail();
    if (gmail) return this.porGmail(gmail, envio);

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

  private async porGmail(
    cuenta: { usuario: string; clave: string },
    envio: Envio,
  ): Promise<ResultadoDeEnvio> {
    try {
      const transporte = nodemailer.createTransport({
        service: "gmail",
        auth: { user: cuenta.usuario, pass: cuenta.clave },
      });
      await transporte.sendMail({
        from: { name: "AntiGro", address: cuenta.usuario },
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
