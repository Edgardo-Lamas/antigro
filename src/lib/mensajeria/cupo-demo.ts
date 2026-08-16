/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EL CUPO DE LA DEMO — hasta tres Telegram conectados a la vez
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  🔑 Para que alguien crea que el sistema entrega de verdad, tiene que llegarle
 *  a su propio teléfono. Por eso el QR: se escanea, se aprieta "Iniciar", y el
 *  aviso llega. Sin instalar nada y sin dar un número.
 *
 *  🔴 **Tres, y no es un número puesto al azar: es el modelo del producto.**
 *  Dos adultos responsables —uno de ellos elegido por el chico— y el chico en
 *  su propio canal. Tres personas escaneando el mismo QR reciben tres textos
 *  distintos, y ahí se ve de un vistazo lo que separa a AntiGro de un control
 *  parental: al chico también se le habla, y no se le habla igual.
 *
 *  🔐 **Y es el tope de seguridad.** El QR queda en una página pública: sin
 *  cupo, cualquiera con un script conecta miles de chats y el bot termina
 *  mandando lo que quiera el que lo encontró. Con tres, el peor caso es que
 *  tres desconocidos vean el mensaje de demostración de una chica inventada.
 *
 *  ⚠ **El visitante NO se convierte en Ana.** Ocupa el lugar de un rol para ver
 *  qué le llegaría a esa persona. La familia sembrada no se toca: si el QR
 *  escribiera dentro de ella, la demo quedaría distinta para el que entra
 *  después, y encima con el canal de una "familia" ocupado por un desconocido.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  🔴 **POR QUÉ ESTO VIVE EN LA BASE Y NO EN MEMORIA (16/8)**
 *
 *  Estuvo en `globalThis` y **en producción no funcionaba**: en Vercel cada
 *  ruta de API es una función distinta con su propia memoria, así que el
 *  webhook tomaba el cupo en la suya y la consola seguía mostrando 0 de 3,
 *  siempre. En local andaba porque es un solo proceso — por eso pasó las
 *  pruebas. Es la misma trampa que ya nos habíamos comido con el repositorio,
 *  repetida acá: **si dos rutas tienen que ver el mismo dato, el dato no puede
 *  vivir en memoria.**
 *
 *  🔑 Y el arreglo trajo algo que en memoria no se podía tener: **el índice
 *  único sobre `rol` ES el cupo.** Como hay exactamente tres roles, la base
 *  sola garantiza que no haya dos personas en el mismo lugar aunque dos
 *  escaneen en el mismo segundo. Contar filas en la aplicación era una carrera.
 *
 *  Sin base configurada se sigue usando la memoria: el modo demo tiene que
 *  andar siempre, y en una sola máquina la memoria alcanza.
 */

import { baseDeDatos } from "@/lib/supabase";

/** 🔐 El tope. Ver arriba: es el modelo del producto y es el límite de abuso. */
export const CUPO = 3;

/**
 * 🔐 El código que va en el QR.
 *
 * Lleva guion y letras que **el generador de códigos reales nunca emite**
 * (su alfabeto excluye 0/O y 1/I/L justamente para que se dicten sin
 * confusión). Es lo que garantiza que este código público no pueda colisionar
 * jamás con el de una familia real: no es una convención, es imposible.
 */
export const CODIGO_DEMO = "DEMO-ANTIGRO";

/** Se libera solo. Un cupo tomado para siempre es un cupo perdido. */
const VENCE_EN_MS = 30 * 60 * 1000;

export type RolDemo = "madre" | "tia" | "chico";

export const ROLES: { rol: RolDemo; nombre: string; explica: string }[] = [
  { rol: "madre", nombre: "Mariana, la madre", explica: "Adulta responsable" },
  { rol: "tia", nombre: "Carla, la tía", explica: "La adulta que eligió Ana" },
  { rol: "chico", nombre: "Ana, 12 años", explica: "El texto es distinto: es para ella" },
];

export interface CupoTomado {
  chatId: string;
  rol: RolDemo;
  /** El nombre con el que la persona figura en Telegram. Para poder saludarla. */
  nombre: string;
  /** Última señal de vida, en ISO. Lo que corre el vencimiento. */
  visto: string;
}

export type ResultadoDeCupo =
  | { ok: true; cupo: CupoTomado; yaEstaba: boolean }
  | { ok: false; motivo: "lleno" };

function limiteDeVencimiento(): string {
  return new Date(Date.now() - VENCE_EN_MS).toISOString();
}

/* ═══════════════════════════════════════════════════════════════════════════
   EN LA BASE — lo que corre en producción
   ═══════════════════════════════════════════════════════════════════════════ */

interface FilaDeCupo {
  chat_id: string;
  rol: RolDemo;
  nombre: string;
  visto: string;
}

const deFila = (f: FilaDeCupo): CupoTomado => ({
  chatId: f.chat_id,
  rol: f.rol,
  nombre: f.nombre,
  visto: f.visto,
});

/**
 * Los vivos, y de paso barre los vencidos.
 *
 * Se limpia en la lectura y no con una tarea programada: son tres filas como
 * mucho, el barrido cuesta nada, y una tarea programada es una pieza más que
 * se puede caer sin que nadie se entere.
 */
async function vivosEnLaBase(db: NonNullable<ReturnType<typeof baseDeDatos>>) {
  await db.from("cupo_demo").delete().lt("visto", limiteDeVencimiento());
  const { data } = await db.from("cupo_demo").select("chat_id, rol, nombre, visto");
  return ((data ?? []) as FilaDeCupo[]).map(deFila);
}

async function tomarEnLaBase(
  db: NonNullable<ReturnType<typeof baseDeDatos>>,
  chatId: string,
  nombre: string,
): Promise<ResultadoDeCupo> {
  const actuales = await vivosEnLaBase(db);

  /* Idempotente: apretar "Iniciar" dos veces —que es lo que hace cualquiera
     que duda si funcionó— no puede consumir otro lugar. */
  const existente = actuales.find((c) => c.chatId === chatId);
  if (existente) {
    const visto = new Date().toISOString();
    await db
      .from("cupo_demo")
      .update({ visto, nombre: nombre || existente.nombre })
      .eq("chat_id", chatId);
    return {
      ok: true,
      cupo: { ...existente, visto, nombre: nombre || existente.nombre },
      yaEstaba: true,
    };
  }

  const ocupados = new Set(actuales.map((c) => c.rol));
  const libres = ROLES.filter((r) => !ocupados.has(r.rol));

  /* 🔑 Se prueban los roles libres de a uno. Si entre que leímos y escribimos
     otro se metió en ese lugar, el índice único lo rechaza (23505) y pasamos
     al siguiente en vez de pisarlo. Esto es exactamente lo que en memoria no
     se podía hacer bien. */
  for (const libre of libres) {
    const fila: FilaDeCupo = {
      chat_id: chatId,
      rol: libre.rol,
      nombre,
      visto: new Date().toISOString(),
    };
    const { error } = await db.from("cupo_demo").insert(fila);
    if (!error) return { ok: true, cupo: deFila(fila), yaEstaba: false };
    if (error.code !== "23505") return { ok: false, motivo: "lleno" };
  }

  return { ok: false, motivo: "lleno" };
}

/* ═══════════════════════════════════════════════════════════════════════════
   EN MEMORIA — sin base configurada, para que el modo demo ande igual
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠ Va colgado de `globalThis` y no de una variable de módulo: Next le puede
 * dar a cada ruta su propia copia del módulo. Eso alcanza en una sola máquina
 * y **no alcanza en Vercel** — ver el encabezado del archivo.
 */
const almacen = globalThis as unknown as { __cupoAntiGro?: CupoTomado[] };
almacen.__cupoAntiGro ??= [];

function vivosEnMemoria(): CupoTomado[] {
  const limite = Date.parse(limiteDeVencimiento());
  almacen.__cupoAntiGro = (almacen.__cupoAntiGro ?? []).filter(
    (c) => new Date(c.visto).getTime() > limite,
  );
  return almacen.__cupoAntiGro;
}

function tomarEnMemoria(chatId: string, nombre: string): ResultadoDeCupo {
  const actuales = vivosEnMemoria();
  const ahora = new Date().toISOString();

  const existente = actuales.find((c) => c.chatId === chatId);
  if (existente) {
    existente.visto = ahora;
    existente.nombre = nombre || existente.nombre;
    return { ok: true, cupo: existente, yaEstaba: true };
  }

  if (actuales.length >= CUPO) return { ok: false, motivo: "lleno" };

  const ocupados = new Set(actuales.map((c) => c.rol));
  const libre = ROLES.find((r) => !ocupados.has(r.rol));
  // No puede pasar mientras CUPO === ROLES.length, pero si alguien cambia uno
  // de los dos números, es mejor negar el cupo que repartir un rol repetido.
  if (!libre) return { ok: false, motivo: "lleno" };

  const cupo: CupoTomado = { chatId, rol: libre.rol, nombre, visto: ahora };
  actuales.push(cupo);
  return { ok: true, cupo, yaEstaba: false };
}

/* ═══════════════════════════════════════════════════════════════════════════
   LO QUE USA EL RESTO DEL SISTEMA
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los conectados ahora mismo, ya sin los vencidos. */
export async function conectados(): Promise<CupoTomado[]> {
  const db = baseDeDatos();
  if (db) return vivosEnLaBase(db);
  return [...vivosEnMemoria()];
}

/**
 * Le da un lugar a quien acaba de escanear el QR.
 *
 * Es **idempotente**: si el mismo chat vuelve a apretar "Iniciar" no consume
 * otro cupo, sólo renueva su vencimiento. Sin esto, apretar dos veces llenaría
 * la demo sola.
 */
export async function tomarCupo(chatId: string, nombre: string): Promise<ResultadoDeCupo> {
  const db = baseDeDatos();
  if (db) return tomarEnLaBase(db, chatId, nombre);
  return tomarEnMemoria(chatId, nombre);
}

/** Suelta un lugar. Lo usa quien manda "/chau" al bot. */
export async function soltarCupo(chatId: string): Promise<boolean> {
  const db = baseDeDatos();
  if (db) {
    const { data } = await db
      .from("cupo_demo")
      .delete()
      .eq("chat_id", chatId)
      .select("chat_id");
    return (data ?? []).length > 0;
  }

  const antes = vivosEnMemoria().length;
  almacen.__cupoAntiGro = vivosEnMemoria().filter((c) => c.chatId !== chatId);
  return almacen.__cupoAntiGro.length < antes;
}

/** Marca actividad: el que está recibiendo avisos no debería vencer. */
export async function renovar(chatId: string): Promise<void> {
  const db = baseDeDatos();
  if (db) {
    await db.from("cupo_demo").update({ visto: new Date().toISOString() }).eq("chat_id", chatId);
    return;
  }
  const cupo = vivosEnMemoria().find((c) => c.chatId === chatId);
  if (cupo) cupo.visto = new Date().toISOString();
}

export function nombreDelRol(rol: RolDemo): string {
  return ROLES.find((r) => r.rol === rol)?.nombre ?? rol;
}

/** Los adultos reciben el texto de los adultos; el chico, el suyo. */
export function esAdulto(rol: RolDemo): boolean {
  return rol !== "chico";
}
