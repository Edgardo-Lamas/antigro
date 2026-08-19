/**
 * Transporte: Telegram.
 *
 * Es el canal con el que se demuestra el sistema: no exige verificación de
 * empresa ni plantillas aprobadas, y el chico ya lo tiene instalado.
 *
 * ✅ El bot existe: `@AntiGroArBot`. Es **el único canal real** del sistema hoy
 * — el correo se reporta en ensayo por falta de dominio verificado (ver
 * `correo.ts`) y WhatsApp saliente exige la API oficial de Meta.
 *
 * Si faltara el token, este transporte se reporta no disponible y los envíos
 * caen en modo ensayo, sin fingir nada.
 */

import type { Envio, EstadoDeTransporte, ResultadoDeEnvio, Transporte } from "./tipos";
import { ETIQUETA_DEL_ACUSE, callbackDelAcuse } from "./acuse";

const API = "https://api.telegram.org";

export class TransporteTelegram implements Transporte {
  readonly canal = "telegram" as const;
  readonly nombre = "Telegram";

  private get token() {
    return process.env.TELEGRAM_BOT_TOKEN ?? "";
  }

  async estado(): Promise<EstadoDeTransporte> {
    if (!this.token) return { disponible: false, motivo: "Falta TELEGRAM_BOT_TOKEN" };

    try {
      const res = await fetch(`${API}/bot${this.token}/getMe`, { cache: "no-store" });
      const cuerpo = (await res.json()) as { ok: boolean; result?: { username?: string } };
      if (!cuerpo.ok) return { disponible: false, motivo: "Telegram rechazó el token" };
      return { disponible: true, detalle: `@${cuerpo.result?.username ?? "bot"}` };
    } catch {
      return { disponible: false, motivo: "No se pudo contactar a Telegram" };
    }
  }

  async enviar(envio: Envio): Promise<ResultadoDeEnvio> {
    if (!this.token) {
      return {
        transporte: this.nombre,
        entregado: false,
        ensayo: false,
        detalle: "Falta TELEGRAM_BOT_TOKEN",
      };
    }

    try {
      const res = await fetch(`${API}/bot${this.token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: envio.destino,
          text: envio.texto,
          // Sin formato: el texto viene de la IA y un guion suelto rompería el parseo.
          disable_web_page_preview: true,
          /* 🔑 El botón «Lo vi». Va sólo si quien manda generó un token, así el
             transporte no tiene que saber a quién le corresponde y a quién no
             — la orientación al chico nunca lo lleva. */
          ...(envio.acuseToken
            ? {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: ETIQUETA_DEL_ACUSE,
                        callback_data: callbackDelAcuse(envio.acuseToken),
                      },
                    ],
                  ],
                },
              }
            : {}),
        }),
      });

      const cuerpo = (await res.json()) as { ok: boolean; description?: string };
      if (!cuerpo.ok) {
        return {
          transporte: this.nombre,
          entregado: false,
          ensayo: false,
          detalle: cuerpo.description ?? `Telegram respondió ${res.status}`,
        };
      }

      return { transporte: this.nombre, entregado: true, ensayo: false };
    } catch (e) {
      return {
        transporte: this.nombre,
        entregado: false,
        ensayo: false,
        detalle: e instanceof Error ? e.message : "Error al enviar por Telegram",
      };
    }
  }

  /**
   * Contesta el toque de un botón.
   *
   * ⚠ **No es opcional, aunque no se vea:** hasta que no se contesta, Telegram
   * deja el botón girando en el teléfono del que lo apretó. Alguien que
   * confirmó que vio la alerta y ve una ruedita eterna no sabe si confirmó.
   */
  async contestarToque(idDelToque: string, aviso: string): Promise<boolean> {
    if (!this.token) return false;
    try {
      const res = await fetch(`${API}/bot${this.token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: idDelToque, text: aviso }),
      });
      return ((await res.json()) as { ok: boolean }).ok;
    } catch {
      return false;
    }
  }

  /**
   * Saca el botón del mensaje ya mandado y deja escrito que se acusó.
   *
   * 🔑 **Es lo que hace que el token de un solo uso se note.** Sin esto el
   * botón queda ahí, invitando a apretarlo de nuevo para no recibir nada — y
   * un botón que a veces no hace nada enseña a desconfiar de los botones.
   */
  async marcarComoVisto(chatId: string, idDelMensaje: number, pie: string): Promise<boolean> {
    if (!this.token) return false;
    try {
      const res = await fetch(`${API}/bot${this.token}/editMessageReplyMarkup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: idDelMensaje,
          reply_markup: { inline_keyboard: [[{ text: pie, callback_data: "visto" }]] },
        }),
      });
      return ((await res.json()) as { ok: boolean }).ok;
    } catch {
      return false;
    }
  }
}
