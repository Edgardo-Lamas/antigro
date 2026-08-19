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

/* ── Migración 17: la clase de la escalada ────────────────────────────────
   `escalada_adultos` es una clase aparte y no un `alerta_adultos` repetido: es
   lo que permite saber si ya se insistió sin confundirlo con haber avisado dos
   veces por el mismo patrón. Sólo afloja un check: no toca ninguna fila. */
const PASOS = [
  "alter table respuestas drop constraint if exists respuestas_clase_check",
  `alter table respuestas add constraint respuestas_clase_check
     check (clase in ('alerta_adultos', 'orientacion_chico', 'escalada_adultos'))`,
];

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cliente.connect();

try {
  await cliente.query("begin");
  for (const paso of PASOS) await cliente.query(paso);
  await cliente.query("commit");
  console.log("✅ Migración 17 aplicada");
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
