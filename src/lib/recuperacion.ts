/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RECUPERAR LA CONTRASEÑA — las reglas, sin base y sin pantalla (24/9)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **Lo pidió Edgardo, y descartó que lo resuelva él a mano:** *"no puedo
 *  estar pendiente que me pidan hacer el cambio"*. Hasta ese día una familia
 *  que perdía la clave no volvía a entrar nunca más a su panel.
 *
 *  El camino: se pide con el correo → llega un enlace → se pone una clave
 *  nueva. Lo que hace que sea seguro vive acá y se prueba con
 *  `npm run probar-recuperacion`:
 *
 *  - 🔴 **El enlace no se guarda: se guarda su HUELLA.** Quien lea la tabla no
 *    puede usar lo que encuentra.
 *  - 🔴 **Sirve una vez y vence a los 30 minutos.** Un correo queda en la
 *    bandeja para siempre; un enlace que no vence es una llave que queda ahí.
 *  - 🔴 **El correo no dice nada del chico.** Llega a una casilla que puede
 *    leer cualquiera que tenga el teléfono desbloqueado.
 *
 *  ⚠ Se carga con node pelado (las pruebas), así que acá no entra nada de Next
 *  ni de la base. Eso vive en `recuperacion-datos.ts`.
 */

import { createHash, randomBytes } from "node:crypto";

/** Cuánto dura un enlace. */
export const MINUTOS_DE_VIGENCIA = 30;

/** Un enlace nuevo: 32 bytes al azar, que no se adivinan ni se recorren. */
export function enlaceNuevo(): string {
  return randomBytes(32).toString("base64url");
}

/** Lo único que se guarda del enlace. */
export function huellaDelEnlace(enlace: string): string {
  return createHash("sha256").update(enlace).digest("hex");
}

/** Hasta cuándo vale un enlace pedido ahora. */
export function venceEn(ahora: Date): Date {
  return new Date(ahora.getTime() + MINUTOS_DE_VIGENCIA * 60_000);
}

/** ¿Este enlace todavía se puede usar? */
export function sigueValiendo(
  fila: { vence: string; usadoEn: string | null },
  ahora: Date,
): boolean {
  if (fila.usadoEn) return false;
  return Date.parse(fila.vence) > ahora.getTime();
}

/**
 * El correo. 🔴 **Sin ningún dato de la familia ni del chico**: ni nombres, ni
 * cómo viene, ni que hubo avisos. Sólo lo necesario para cambiar la clave.
 *
 * 📌 Y le dice qué hacer si no fue él —nada—, porque el que recibe un pedido
 * que no hizo lo primero que piensa es que le entraron a la cuenta.
 */
export function correoDeRecuperacion(direccion: string): { asunto: string; texto: string } {
  return {
    asunto: "Cambiar la clave de AntiGro",
    texto:
      "Hola.\n\n" +
      "Alguien pidió cambiar la clave de tu cuenta de AntiGro. Si fuiste vos, " +
      "entrá a este enlace y poné una nueva:\n\n" +
      `${direccion}\n\n` +
      `El enlace sirve una sola vez y vence en ${MINUTOS_DE_VIGENCIA} minutos. ` +
      "Al cambiar la clave se cierra cualquier otra sesión que estuviera abierta " +
      "con la anterior.\n\n" +
      "Si no fuiste vos, no hagas nada: tu clave sigue siendo la misma y nadie " +
      "puede cambiarla sin este enlace.\n\n" +
      "AntiGro",
  };
}
