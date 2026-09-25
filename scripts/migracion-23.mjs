/**
 * Migración 23 — recuperar la contraseña (24/9).
 * El porqué está en `supabase/schema.sql` § 23.
 *
 * Uso: node scripts/migracion-23.mjs
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
  await cliente.query(`create table if not exists recuperaciones (
    id          uuid primary key default gen_random_uuid(),
    usuario_id  uuid not null references usuarios(id) on delete cascade,
    huella      text not null unique,
    vence       timestamptz not null,
    usado_en    timestamptz,
    creado      timestamptz not null default now()
  )`);
  await cliente.query("create index if not exists recuperaciones_usuario_idx on recuperaciones (usuario_id)");
  await cliente.query("alter table recuperaciones enable row level security");
  await cliente.query(
    "comment on table recuperaciones is 'Enlaces para recuperar la contrasena. Guarda la huella SHA-256 del enlace, nunca el enlace. Un solo uso, vencen a los 30 minutos.'",
  );
  await cliente.query("commit");
  const { rows } = await cliente.query(
    "select count(*)::int as filas, (select relrowsecurity from pg_class where relname = 'recuperaciones') as rls from recuperaciones",
  );
  console.log("✓ aplicada ·", rows[0]);
} catch (e) {
  await cliente.query("rollback");
  console.error("✗ revertida:", e.message);
  process.exit(1);
} finally {
  await cliente.end();
}
