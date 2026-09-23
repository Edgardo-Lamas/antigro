/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LOS CENTROS EDUCATIVOS, EN LA BASE — 23/9
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 **Sólo existe con base de datos, y lo dice.** Igual que la cuenta de una
 *  familia (`crearHogar` devuelve `sin_base` en memoria): un centro tiene
 *  credencial, licencias y familias colgadas, y nada de eso sobrevive a un
 *  reinicio si vive en memoria. En modo demo, cada función devuelve lo vacío o
 *  `sin_base`, y la pantalla lo cuenta.
 *
 *  🔴 **Ninguna lectura de acá se guarda en caché (`sinCache`).** Lo encontró la
 *  prueba de punta a punta el 23/9: Next 14 guardaba la consulta del cliente de
 *  Supabase, y un centro PAUSADO seguía mostrando el distintivo «vigente». Un
 *  sello que dice que un compromiso existe cuando ya no existe es justo lo que
 *  el distintivo promete no hacer.
 *
 *  🔴 **Nada de acá le devuelve al centro un dato de un alumno.** La única
 *  función que toca chicos (`alumnosDelCentro`) la llama el reloj, del lado del
 *  servidor, y lo que sale de ella pasa por `filasDelCentro`, que es donde se
 *  pierde la identidad.
 */

import bcrypt from "bcryptjs";
import { unstable_noStore as sinCache } from "next/cache";
import { baseDeDatos } from "@/lib/supabase";
import { esPais, type Pais } from "@/lib/paises";
import { generarCodigo } from "@/lib/datos/tipos";
import type { Genero } from "@/lib/datos/tipos";

export interface Centro {
  id: string;
  nombre: string;
  pais: Pais;
  /** 🔐 La invitación para sus familias. Se muestra sólo al propio centro. */
  codigo: string;
  licencias: number;
  /** La dirección pública del distintivo. No sirve para darse de alta. */
  distintivo: string;
  activo: boolean;
  coordinador: string | null;
  /** El `chat_id` de Telegram del coordinador, cuando ya apretó «Iniciar». */
  canalDestino: string | null;
  codigoVinculacion: string | null;
  vinculado: string | null;
  creado: string;
}

type FilaCentro = {
  id: string;
  nombre: string;
  pais: string;
  codigo: string;
  licencias: number;
  distintivo: string;
  activo: boolean;
  coordinador: string | null;
  canal_destino: string | null;
  codigo_vinculacion: string | null;
  vinculado_en: string | null;
  created_at: string;
};

const aCentro = (f: FilaCentro): Centro => ({
  id: f.id,
  nombre: f.nombre,
  pais: esPais(f.pais) ? f.pais : "ES",
  codigo: f.codigo,
  licencias: f.licencias,
  distintivo: f.distintivo,
  activo: f.activo,
  coordinador: f.coordinador,
  canalDestino: f.canal_destino,
  codigoVinculacion: f.codigo_vinculacion,
  vinculado: f.vinculado_en,
  creado: f.created_at,
});

export interface AvisoRegistrado {
  id: string;
  dominio: string;
  alumnos: number;
  porQue: string;
  texto: string;
  entregado: boolean;
  fecha: string;
}

/* ── Lectura ─────────────────────────────────────────────────────────────── */

export async function centroPorId(id: string): Promise<Centro | null> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return null;
  const { data } = await db.from("centros").select("*").eq("id", id).maybeSingle<FilaCentro>();
  return data ? aCentro(data) : null;
}

/**
 * El centro de una invitación, si está activo.
 *
 * 📌 Se compara en mayúsculas: el código se dicta y se copia a mano, y el
 * alfabeto no tiene minúsculas.
 */
export async function centroPorInvitacion(codigo: string): Promise<Centro | null> {
  sinCache();
  const db = baseDeDatos();
  if (!db || !codigo.trim()) return null;
  const { data } = await db
    .from("centros")
    .select("*")
    .eq("codigo", codigo.trim().toUpperCase())
    .eq("activo", true)
    .maybeSingle<FilaCentro>();
  return data ? aCentro(data) : null;
}

/** Para la página pública del distintivo. Trae también los inactivos: hay que poder decir que no está vigente. */
export async function centroPorDistintivo(distintivo: string): Promise<Centro | null> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return null;
  const { data } = await db
    .from("centros")
    .select("*")
    .eq("distintivo", distintivo.toLowerCase())
    .maybeSingle<FilaCentro>();
  return data ? aCentro(data) : null;
}

export async function listarCentros(): Promise<Centro[]> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return [];
  const { data } = await db
    .from("centros")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<FilaCentro[]>();
  return (data ?? []).map(aCentro);
}

/**
 * Cuántas familias sumó el centro. **Un número: nunca cuáles.**
 *
 * 🔑 Es lo único que el centro sabe de sus familias — si la licencia se está
 * usando—, y alcanza para eso.
 */
export async function familiasDelCentro(centroId: string): Promise<number> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return 0;
  const { count } = await db
    .from("familias")
    .select("id", { count: "exact", head: true })
    .eq("centro_id", centroId);
  return count ?? 0;
}

/**
 * 🔴 **Sólo la llama el reloj, del lado del servidor.** Los alumnos de un
 * centro con lo mínimo que el cálculo necesita. Lo que sale de acá entra a
 * `filasDelCentro` y ahí se agrega; nunca llega a una pantalla.
 */
export async function alumnosDelCentro(
  centroId: string,
): Promise<{ id: string; edad: number; genero: Genero }[]> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return [];
  const { data: familias } = await db
    .from("familias")
    .select("id")
    .eq("centro_id", centroId)
    .eq("activo", true)
    .returns<{ id: string }[]>();
  const ids = (familias ?? []).map((f) => f.id);
  if (ids.length === 0) return [];
  const { data: chicos } = await db
    .from("chicos")
    .select("id, edad, genero")
    .in("familia_id", ids)
    .eq("activo", true)
    .returns<{ id: string; edad: number; genero: Genero }[]>();
  return chicos ?? [];
}

export async function avisosDe(centroId: string, limite = 20): Promise<AvisoRegistrado[]> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return [];
  const { data } = await db
    .from("avisos_centro")
    .select("id, dominio, alumnos, por_que, texto, entregado, fecha")
    .eq("centro_id", centroId)
    .order("fecha", { ascending: false })
    .limit(limite)
    .returns<
      {
        id: string;
        dominio: string;
        alumnos: number;
        por_que: string;
        texto: string;
        entregado: boolean;
        fecha: string;
      }[]
    >();
  return (data ?? []).map((a) => ({
    id: a.id,
    dominio: a.dominio,
    alumnos: a.alumnos,
    porQue: a.por_que,
    texto: a.texto,
    entregado: a.entregado,
    fecha: a.fecha,
  }));
}

/** ¿Ya se le avisó este mismo sitio a este centro desde tal fecha? */
export async function yaSeAviso(centroId: string, dominio: string, desde: string): Promise<boolean> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return false;
  const { count } = await db
    .from("avisos_centro")
    .select("id", { count: "exact", head: true })
    .eq("centro_id", centroId)
    .eq("dominio", dominio)
    .gte("fecha", desde);
  return (count ?? 0) > 0;
}

/* ── Escritura ───────────────────────────────────────────────────────────── */

export async function registrarAviso(a: {
  centroId: string;
  dominio: string;
  alumnos: number;
  porQue: string;
  texto: string;
  entregado: boolean;
}): Promise<void> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return;
  const { error } = await db.from("avisos_centro").insert({
    centro_id: a.centroId,
    dominio: a.dominio,
    alumnos: a.alumnos,
    por_que: a.porQue,
    texto: a.texto,
    entregado: a.entregado,
  });
  if (error) throw new Error(error.message);
}

export type ResultadoDeAltaDeCentro =
  | { ok: true; centro: Centro }
  | { ok: false; motivo: "email_tomado" | "sin_base" };

/**
 * Da de alta un centro y la cuenta de su coordinador.
 *
 * 🔑 Lo hace la administración, no el centro solo: un centro llega por una
 * licencia, y la licencia se acuerda antes.
 */
export async function crearCentro(alta: {
  nombre: string;
  pais: Pais;
  licencias: number;
  coordinador: string;
  email: string;
  clave: string;
}): Promise<ResultadoDeAltaDeCentro> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return { ok: false, motivo: "sin_base" };

  const email = alta.email.trim().toLowerCase();
  const { data: yaEsta } = await db.from("usuarios").select("id").eq("email", email).maybeSingle();
  if (yaEsta) return { ok: false, motivo: "email_tomado" };

  const { data, error } = await db
    .from("centros")
    .insert({
      nombre: alta.nombre.trim(),
      pais: alta.pais,
      licencias: alta.licencias,
      coordinador: alta.coordinador.trim(),
      codigo: generarCodigo(10),
      distintivo: generarCodigo(8).toLowerCase(),
      codigo_vinculacion: generarCodigo(6),
    })
    .select("*")
    .single<FilaCentro>();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear el centro");

  const { error: errorUsuario } = await db.from("usuarios").insert({
    email,
    password_hash: await bcrypt.hash(alta.clave, 12),
    nombre: data.nombre,
    rol: "centro",
    centro_id: data.id,
  });
  if (errorUsuario) {
    /* 🔴 Sin cuenta, el centro no sirve y queda ocupando un código. Se deshace. */
    await db.from("centros").delete().eq("id", data.id);
    if (errorUsuario.code === "23505") return { ok: false, motivo: "email_tomado" };
    throw new Error(errorUsuario.message);
  }

  return { ok: true, centro: aCentro(data) };
}

export async function cambiarEstadoDelCentro(id: string, activo: boolean): Promise<void> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return;
  const { error } = await db.from("centros").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * El coordinador apretó «Iniciar» en el bot.
 *
 * 🔴 De un solo uso, igual que el de una familia: `vinculado_en is null` va en
 * el propio `update`.
 */
export async function vincularCoordinador(
  codigo: string,
  destino: string,
): Promise<{ nombre: string; coordinador: string | null } | null> {
  sinCache();
  const db = baseDeDatos();
  if (!db) return null;
  const { data } = await db
    .from("centros")
    .update({ canal_destino: destino, vinculado_en: new Date().toISOString() })
    .eq("codigo_vinculacion", codigo.trim().toUpperCase())
    .is("vinculado_en", null)
    .select("nombre, coordinador")
    .maybeSingle<{ nombre: string; coordinador: string | null }>();
  return data ?? null;
}
