/**
 * Aplica una migración a la base de producción.
 *
 * 🔑 El MCP de Supabase no sirve acá: ve otro proyecto. Lo que funciona es
 * `POSTGRES_URL_NON_POOLING` de `.env.local` con `pg`.
 * ⚠ Hay que sacarle `?sslmode=require` — pg lo lee como verify-full y falla
 * contra el certificado de Supabase.
 * 🔴 Todo dentro de una transacción: una migración a mitad de camino deja el
 * esquema sin corresponderse con ninguna versión del código.
 *
 * Uso: node supabase/aplicar-migracion.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const linea = env.split("\n").find((l) => l.startsWith("POSTGRES_URL_NON_POOLING="));
if (!linea) {
  console.error("Falta POSTGRES_URL_NON_POOLING en .env.local");
  process.exit(1);
}

const url = linea
  .slice("POSTGRES_URL_NON_POOLING=".length)
  .trim()
  .replace(/^"|"$/g, "")
  .replace(/\?sslmode=require/, "");

/* ── Migración 19: el registro de accesos ─────────────────────────────────
   Dos cosas distintas y por eso dos formas distintas:

   1. `usuarios.ultimo_acceso` — un DATO, no un historial: se pisa cada vez.
      Contesta «¿la otra casa está participando?» sin dejar reconstruir a qué
      hora entra nadie, y habilita cerrar una segunda puerta mal tipeada
      mientras nadie la haya usado.
   2. `accesos` — los hechos que no dejan rastro en ningún otro lado. Lo que
      una casa APORTA o CAMBIA, nunca lo que MIRA.

   ⚠ Todo aditivo: ninguna columna se borra y ninguna restricción se endurece
   sobre datos que ya están. El código viejo sigue andando con este esquema. */
const PASOS = [
  "alter table usuarios add column if not exists ultimo_acceso timestamptz",

  `comment on column usuarios.ultimo_acceso is
     'Ultima vez que se abrio sesion con esta credencial. Se PISA, no acumula: es un dato, no un historial. Con padres separados un historial de entradas se vuelve vigilancia entre ellos.'`,

  `create table if not exists accesos (
     id          uuid primary key default gen_random_uuid(),
     familia_id  uuid not null references familias(id) on delete cascade,
     usuario_id  uuid references usuarios(id) on delete set null,
     hogar       text,
     que         text not null,
     detalle     text,
     fecha       timestamptz not null default now()
   )`,

  "alter table accesos drop constraint if exists accesos_que_check",

  `alter table accesos add constraint accesos_que_check
     check (que in ('abrio_la_segunda_puerta', 'cerro_una_puerta', 'cambio_la_clave',
                    'dio_de_baja_un_adulto', 'borro_la_charla'))`,

  "create index if not exists accesos_familia_fecha_idx on accesos (familia_id, fecha desc)",

  "alter table accesos enable row level security",

  `comment on table accesos is
     'Lo que una casa APORTA o CAMBIA, fechado. Nunca lo que MIRA: leer el informe o al asistente no deja rastro, a proposito. El cuestionario no esta aca porque ya firma en observaciones.'`,
];

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cliente.connect();

try {
  await cliente.query("begin");
  for (const paso of PASOS) await cliente.query(paso);
  await cliente.query("commit");
  console.log("✅ Migración 19 aplicada");
} catch (e) {
  await cliente.query("rollback");
  console.error("❌ Revertida entera:", e.message);
  process.exit(1);
}

/* ── Comprobar contra la base, no contra la intención ──────────────────── */
const { rows: cols } = await cliente.query(
  `select column_name, data_type, is_nullable from information_schema.columns
    where table_name = 'accesos' order by ordinal_position`,
);
console.table(cols);

const { rows: ua } = await cliente.query(
  `select column_name, data_type from information_schema.columns
    where table_name = 'usuarios' and column_name = 'ultimo_acceso'`,
);
console.log("usuarios.ultimo_acceso:", ua[0] ?? "❌ NO ESTÁ");

/* 🔴 Que el check exista de verdad: si alguien inventa un hecho nuevo tiene que
   fallar acá, y no quedar un registro con una palabra que nadie sabe leer. */
const { rows: chk } = await cliente.query(
  `select pg_get_constraintdef(oid) as def from pg_constraint
    where conname = 'accesos_que_check'`,
);
console.log("check:", chk[0]?.def ?? "❌ NO ESTÁ");

const { rows: puertas } = await cliente.query(
  `select familia_id, hogar, email, ultimo_acceso from usuarios where rol = 'adulto' order by created_at`,
);
console.table(puertas);

await cliente.end();
