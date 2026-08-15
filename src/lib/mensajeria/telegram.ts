/**
 * Transporte: Telegram.
 *
 * Es el canal con el que se demuestra el sistema: no exige verificación de
 * empresa ni plantillas aprobadas, y el chico ya lo tiene instalado.
 *
 * 📌 Falta el token del bot. Se saca en dos minutos hablándole a @BotFather
 * dentro de Telegram (`/newbot`) y se completa `TELEGRAM_BOT_TOKEN`. Hasta
 * entonces este transporte se reporta como no disponible y los envíos caen
 * en modo ensayo, sin fingir nada.
 */

import type { Envio, EstadoDeTransporte, ResultadoDeEnvio, Transporte } from "./tipos";

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
}
