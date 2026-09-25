/**
 * La recuperación de la contraseña, del lado de la base (24/9). Las reglas
 * están en `recuperacion.ts`; el porqué de la tabla, en `schema.sql` § 23.
 */

import bcrypt from "bcryptjs";
import { unstable_noStore } from "next/cache";
import { baseDeDatos } from "@/lib/supabase";
import { enlaceNuevo, huellaDelEnlace, venceEn } from "@/lib/recuperacion";

/**
 * Si el correo es de una puerta que puede recuperarse, arma un enlace nuevo y
 * lo devuelve. Si no, `null` — y quien llama contesta lo MISMO en los dos casos:
 * decir «ese correo no tiene cuenta» dejaría averiguar qué direcciones usan un
 * sistema que cuida chicos.
 *
 * 🔴 Sólo familias y centros activos. La administración no se recupera por acá:
 * su clave vive en el entorno, no en la base.
 */
export async function pedirRecuperacion(
  email: string,
  ahora: Date,
): Promise<{ enlace: string; email: string } | null> {
  unstable_noStore();
  const db = baseDeDatos();
  if (!db) return null;

  const { data: u } = await db
    .from("usuarios")
    .select("id, email, rol, activo, familia_id, centro_id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle<{
      id: string;
      email: string;
      rol: string;
      activo: boolean;
      familia_id: string | null;
      centro_id: string | null;
    }>();

  if (!u || !u.activo) return null;

  if (u.rol === "adulto" && u.familia_id) {
    const { data: f } = await db.from("familias").select("activo").eq("id", u.familia_id).maybeSingle();
    if (!f || f.activo === false) return null;
  } else if (u.rol === "centro" && u.centro_id) {
    const { data: c } = await db.from("centros").select("activo").eq("id", u.centro_id).maybeSingle();
    if (!c || c.activo === false) return null;
  } else {
    return null;
  }

  /* 🔑 Pedir otro enlace anula los anteriores sin usar: si alguien pidió dos
     veces, el que vale es el último correo, que es el que va a abrir. */
  await db.from("recuperaciones").delete().eq("usuario_id", u.id).is("usado_en", null);

  const enlace = enlaceNuevo();
  const { error } = await db.from("recuperaciones").insert({
    usuario_id: u.id,
    huella: huellaDelEnlace(enlace),
    vence: venceEn(ahora).toISOString(),
  });
  if (error) throw new Error(error.message);

  return { enlace, email: u.email };
}

/**
 * Usa un enlace y cambia la clave. `null` si el enlace no existe, venció o ya
 * se usó.
 *
 * 🔴 **El enlace se marca como usado en el MISMO `update` que lo busca**, con
 * la condición adentro. Entre mirar y marcar hay un hueco, y en ese hueco dos
 * pedidos con el mismo enlace podrían pasar los dos. Es el criterio de la
 * vinculación por código y del cierre de puertas.
 */
export async function usarRecuperacion(
  enlace: string,
  nueva: string,
  ahora: Date,
): Promise<{
  usuarioId: string;
  rol: string;
  familiaId: string | null;
  hogar: string | null;
} | null> {
  unstable_noStore();
  const db = baseDeDatos();
  if (!db) return null;

  const { data: fila } = await db
    .from("recuperaciones")
    .update({ usado_en: ahora.toISOString() })
    .eq("huella", huellaDelEnlace(enlace))
    .is("usado_en", null)
    .gt("vence", ahora.toISOString())
    .select("usuario_id")
    .maybeSingle<{ usuario_id: string }>();

  if (!fila) return null;

  const hash = await bcrypt.hash(nueva, 12);
  /* 🔴 `clave_cambiada_en` corta las sesiones abiertas con la clave vieja
     (migración 22). Si la clave se recupera porque alguien la robó, esto es lo
     que lo saca. Con el reloj de la app: ver `sesionVigente`. */
  const { data: u, error } = await db
    .from("usuarios")
    .update({ password_hash: hash, clave_cambiada_en: new Date().toISOString() })
    .eq("id", fila.usuario_id)
    .select("id, rol, familia_id, hogar")
    .maybeSingle<{ id: string; rol: string; familia_id: string | null; hogar: string | null }>();

  if (error || !u) throw new Error(error?.message ?? "no se encontró la puerta");

  return { usuarioId: u.id, rol: u.rol, familiaId: u.familia_id, hogar: u.hogar };
}
