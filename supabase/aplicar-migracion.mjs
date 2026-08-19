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

/* ── Migración 15: la firma del cuestionario ──────────────────────────────
   `hogar` es el HECHO (sale de la sesión) al lado de `adulto_id`, que es la
   DECLARACIÓN de quién contestó. Aditiva y nullable: no toca ninguna fila. */
const PASOS = [
  "alter table observaciones add column if not exists hogar text",
  "comment on column observaciones.hogar is 'Desde que casa se contesto. Es un HECHO: sale de la sesion, no del formulario. Se lee junto a adulto_id, que es una DECLARACION de quien contesto. Null = casa unica, no dato faltante.'",
];

const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await cliente.connect();

try {
  await cliente.query("begin");
  for (const paso of PASOS) await cliente.query(paso);
  await cliente.query("commit");
  console.log("✅ Migración 15 aplicada");
} catch (e) {
  await cliente.query("rollback");
  console.error("❌ Revertida entera:", e.message);
  process.exit(1);
}

const { rows } = await cliente.query(
  `select column_name, data_type, is_nullable from information_schema.columns
    where table_name = 'observaciones' order by ordinal_position`,
);
console.table(rows);

const { rows: n } = await cliente.query("select count(*)::int as n from observaciones");
console.log("Observaciones que ya había:", n[0].n);

await cliente.end();
