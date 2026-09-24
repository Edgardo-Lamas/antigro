/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LA SESIÓN DE UNA CASA, COMPROBADA CONTRA LA BASE — auditoría del 24/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔴 **La sesión es un JWT que dura 30 días, y lo que dice se decidió el día
 *  que se entró.** Hasta el 24/9 cada ruta le creía sin preguntar nada más, y
 *  eso dejaba tres agujeros:
 *
 *  1. **Cambiar la clave no echaba a nadie.** Una sesión robada, o un teléfono
 *     que quedó logueado en otra casa, seguía viendo el informe de un chico
 *     hasta que vencía.
 *  2. **Una familia pausada seguía operando.** Sólo 4 de las 11 rutas de la
 *     familia miraban `familia.activo`; el resto dejaba cambiar la clave, el
 *     país o dar de baja a un adulto.
 *  3. **Una puerta borrada o desactivada** seguía abriendo.
 *
 *  🔑 **Por eso esto vive en UN lugar.** Estaba copiado en once rutas —con
 *  once nombres: `quienPide`, `hogarDeLaSesion`, el `if` suelto— y así fue como
 *  siete se olvidaron de mirar si la familia estaba activa. Una regla escrita en
 *  once lugares no se puede probar: es la misma lección que `juntarObservaciones`
 *  (19/8).
 *
 *  📌 Cuesta una consulta por pedido. Es el precio de poder cortar una sesión.
 */

import { auth } from "@/auth";
import { baseDeDatos } from "@/lib/supabase";
import { sesionVigente } from "@/lib/hogares";

export interface HogarDeLaSesion {
  familiaId: string;
  /** La puerta: la fila de `usuarios`. */
  usuarioId: string;
  /** Cuál de las dos casas. `null` cuando hay una sola, que es lo normal. */
  hogar: string | null;
  email: string | null;
  /** El nombre con el que se dio de alta la puerta. */
  nombre: string | null;
}

interface LoQueTraeLaSesion {
  rol?: string;
  familiaId?: string | null;
  usuarioId?: string | null;
  hogar?: string | null;
  email?: string | null;
  name?: string | null;
  /** Cuándo se entró (ms). Ver el callback `jwt` de `auth.ts`. */
  emitido?: number | null;
}

/**
 * La casa de la sesión, o `null` si no hay una que valga. Quien llama contesta
 * 401: para el que está del otro lado, «nunca entraste» y «tu sesión se cortó»
 * se resuelven igual, entrando de nuevo.
 */
export async function hogarDeLaSesion(): Promise<HogarDeLaSesion | null> {
  const sesion = await auth();
  const u = sesion?.user as LoQueTraeLaSesion | undefined;
  if (!sesion || u?.rol !== "adulto" || !u.familiaId || !u.usuarioId) return null;

  const deLaSesion: HogarDeLaSesion = {
    familiaId: u.familiaId,
    usuarioId: u.usuarioId,
    hogar: u.hogar ?? null,
    email: u.email ?? null,
    nombre: u.name ?? null,
  };

  /* 📌 Sin base, el sistema corre en modo demo y no hay contra qué comprobar.
     Tiene que andar igual: es lo que deja entrar al jurado sin cuenta. */
  const db = baseDeDatos();
  if (!db) return deLaSesion;

  const { data, error } = await db
    .from("usuarios")
    .select("activo, familia_id, clave_cambiada_en, familias(activo)")
    .eq("id", u.usuarioId)
    .maybeSingle<{
      activo: boolean;
      familia_id: string | null;
      clave_cambiada_en: string | null;
      familias: { activo: boolean } | { activo: boolean }[] | null;
    }>();

  /* 🔴 Si la base no contesta, se cierra. La ruta que llama iba a necesitar la
     base igual, así que dejar pasar no le ahorra un error a nadie: sólo le
     ahorra la comprobación al que no debería estar. */
  if (error || !data) {
    if (error) console.error("[sesion] no se pudo comprobar la sesión:", error.message);
    return null;
  }

  const familia = Array.isArray(data.familias) ? data.familias[0] : data.familias;

  if (!data.activo) return null;
  if (data.familia_id !== u.familiaId) return null;
  if (!familia || familia.activo === false) return null;
  if (!sesionVigente(u.emitido, data.clave_cambiada_en)) return null;

  return deLaSesion;
}
