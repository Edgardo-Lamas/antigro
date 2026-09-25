import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compara un secreto recibido con el esperado sin que el tiempo delate cuántos
 * caracteres acertó (AUD-013). `!==` corta en la primera diferencia: midiendo
 * la respuesta se puede adivinar el secreto de a una letra.
 *
 * 📌 Se comparan las huellas SHA-256 y no los textos: `timingSafeEqual` exige
 * el mismo largo, y rechazar antes por largo distinto también es una pista.
 */
export function mismoSecreto(recibido: string | null | undefined, esperado: string): boolean {
  if (recibido == null) return false;
  const huella = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(huella(recibido), huella(esperado));
}
