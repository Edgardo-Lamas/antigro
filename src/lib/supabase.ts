import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Acceso a Supabase con service role, desde el servidor.
 *
 * 🔴 El modo demo tiene que seguir andando siempre: es lo que permite que el
 * jurado entre sin cuenta, y son 25 puntos. Por eso todo el sistema pregunta
 * primero `hayBase()` y tiene una respuesta útil cuando no la hay.
 */

export function hayBase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

let cliente: SupabaseClient | null = null;

export function baseDeDatos(): SupabaseClient | null {
  if (!hayBase()) return null;
  if (!cliente) {
    cliente = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return cliente;
}

/** Token de acceso para el enlace privado de cada familia. */
export function generarToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
