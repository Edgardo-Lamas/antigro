/**
 * Migración 22 — cambiar la clave cierra las otras sesiones (24/9, auditoría).
 * El porqué está en `supabase/schema.sql` § 22.
 *
 * Uso: node scripts/migracion-22.mjs
 *
 * 📌 Mismo método que `migracion-20.mjs`: la cadena de `.env.local`, sin los
 * parámetros de SSL, y todo adentro de una transacción.
 */
import fs from "node:fs";
import pg from "pg";

const REPO = new URL("..", import.meta.url).pathname;
const env = Object.fromEntries(
  fs
    .readFileSync(`${REPO}.env.local`, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = new URL(env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_URL);
for (const p of ["sslmode", "uselibpqcompat", "ssl"]) url.searchParams.delete(p);
console.log("base:", url.host, "· proyecto:", decodeURIComponent(url.username).split(".")[1] ?? "(directo)");

const cliente = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await cliente.connect();
try {
  await cliente.query("begin");
  await cliente.query("alter table usuarios add column if not exists clave_cambiada_en timestamptz");
  await cliente.query(
    "comment on column usuarios.clave_cambiada_en is 'Cuando se cambio la clave de esta puerta por ultima vez. Las sesiones abiertas antes de esto dejan de valer. Null: nunca se cambio.'",
  );
  await cliente.query("commit");
  const { rows } = await cliente.query(
    "select count(*)::int as puertas, count(clave_cambiada_en)::int as con_fecha from usuarios",
  );
  console.log("✓ aplicada ·", rows[0]);
} catch (e) {
  await cliente.query("rollback");
  console.error("✗ revertida:", e.message);
  process.exit(1);
} finally {
  await cliente.end();
}
