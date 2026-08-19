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

/* ── Migración 16: el acuse de recibo ─────────────────────────────────────
   `entregado` sólo decía que el transporte aceptó el mensaje. Estas dos
   columnas son la diferencia entre eso y que alguien lo haya visto.
   Aditivas y nullable: no tocan ninguna fila. */
const PASOS = [
  "alter table respuestas add column if not exists acuse_token text",
  "alter table respuestas add column if not exists acusado_en timestamptz",
  `create unique index if not exists respuestas_acuse_token_idx
     on respuestas (acuse_token) where acuse_token is not null`,
  "comment on column respuestas.acuse_token is 'Token del boton «Lo vi». De un solo uso y atado a esta fila, asi el acuse dice quien lo apreto sin que nadie lo declare. Solo lo llevan las alertas a adultos.'",
  "comment on column respuestas.acusado_en is 'Cuando apreto «Lo vi». Vacio con token presente = se mando y nadie lo vio: eso es lo que dispara la escalada.'",
];

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cliente.connect();

try {
  await cliente.query("begin");
  for (const paso of PASOS) await cliente.query(paso);
  await cliente.query("commit");
  console.log("✅ Migración 16 aplicada");
} catch (e) {
  await cliente.query("rollback");
  console.error("❌ Revertida entera:", e.message);
  process.exit(1);
}

const { rows } = await cliente.query(
  `select column_name, data_type, is_nullable from information_schema.columns
    where table_name = 'respuestas' order by ordinal_position`,
);
console.table(rows);

const { rows: n } = await cliente.query("select count(*)::int as n from respuestas");
console.log("Respuestas que ya había:", n[0].n);

await cliente.end();
