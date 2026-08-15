/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VINCULACIÓN — cómo una persona real queda conectada sin configurar nada
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 🔴 El punto entero: **la familia no crea ningún bot y no genera ninguna clave.**
 * AntiGro tiene UN bot para todo el sistema. Cada persona se conecta apretando
 * "Iniciar" una vez, desde un enlace o un QR.
 *
 * Por qué hace falta un código y no alcanza con cargar un número: Telegram no
 * deja escribirle a nadie por teléfono. Sólo se puede responder a un `chat_id`,
 * y ese número aparece recién cuando la persona le habla al bot. El código es
 * lo que permite saber CUÁL de todas las personas es la que acaba de escribir.
 */

const TELEGRAM = "https://t.me";

/** Nombre del bot, sin arroba. Se completa al crearlo con @BotFather. */
export function nombreDelBot(): string | null {
  const bruto = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (!bruto) return null;
  return bruto.replace(/^@/, "");
}

/**
 * El enlace que se le pasa a cada persona. Al abrirlo, Telegram muestra el
 * botón "Iniciar" y manda `/start CODIGO` al bot — un toque, nada más.
 */
export function enlaceDeVinculacion(codigo: string): string | null {
  const bot = nombreDelBot();
  if (!bot) return null;
  return `${TELEGRAM}/${bot}?start=${encodeURIComponent(codigo)}`;
}

/** Extrae el código de un `/start CODIGO`. Devuelve null si no es eso. */
export function codigoDeUnStart(texto: string): string | null {
  const encontrado = /^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{4,32})\s*$/.exec(texto.trim());
  return encontrado ? encontrado[1].toUpperCase() : null;
}
