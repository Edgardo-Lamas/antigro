/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MIGRACIÓN 20 — el país de la familia
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Se corre UNA vez:  node scripts/migracion-20.mjs
 *
 *  🔑 **Por qué existe este archivo y no se corrió el SQL a mano.** La base de
 *  AntiGro es un Supabase creado desde el Marketplace de Vercel
 *  (`supabase-beige-flower`), así que **el MCP de Supabase de esta máquina no
 *  llega**: ve otro proyecto, también llamado `antigro`, en una cuenta distinta.
 *  La conexión buena es la que ya está en `.env.local`.
 *
 *  🔴 **La cadena de conexión NO se imprime.** Lo único que sale por pantalla es
 *  el host, para poder verificar contra qué base se está corriendo.
 *
 *  📌 Es aditiva: agrega una columna con Argentina por defecto y amplía qué se
 *  puede registrar. No borra ni cambia ninguna fila. Se puede volver a correr
 *  sin romper nada (`if not exists` y `drop constraint if exists`).
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

const cadena = env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_URL;
if (!cadena) {
  console.error("✗ No hay cadena de conexión en .env.local");
  process.exit(1);
}

/* ─────────────────────────────────────────────────────────────────────────────
   🔴 EL SSL DE LA CADENA SE SACA A MANO, Y NO ES UN CAPRICHO
   ─────────────────────────────────────────────────────────────────────────────

   La cadena que inyecta Vercel viene con `sslmode=require`, y `pg` lo trata hoy
   como `verify-full`: exige validar el certificado contra una CA que Node no
   trae, así que la conexión muere con «self-signed certificate in certificate
   chain» — pasó en el primer intento. **Un `ssl` en el objeto no alcanza: lo que
   está en la cadena manda.** Por eso se le quitan los parámetros de SSL a la URL
   y la decisión se toma acá abajo, en un solo lugar.

   ⚠ `rejectUnauthorized: false` **no apaga el cifrado** —la conexión sigue yendo
   por TLS—, apaga la verificación de la cadena de certificados. Es aceptable para
   una migración puntual corrida a mano desde la máquina del dueño, y no para el
   tráfico normal de la app, que no pasa por acá. */
const url = new URL(cadena);
for (const p of ["sslmode", "uselibpqcompat", "ssl"]) url.searchParams.delete(p);

/* Ni usuario ni contraseña: sólo el host y el identificador del proyecto, que es
   lo único que hace falta para saber contra qué base se está corriendo. */
const refDelProyecto = decodeURIComponent(url.username).split(".")[1] ?? "(directo)";
console.log("base:", url.host, "· proyecto:", refDelProyecto);

const PASOS = [
  [
    "la columna pais",
    "alter table familias add column if not exists pais text not null default 'AR'",
  ],
  ["sacar el check viejo", "alter table familias drop constraint if exists familias_pais_check"],
  [
    "el check de pais",
    "alter table familias add constraint familias_pais_check check (pais in ('AR', 'ES'))",
  ],
  ["sacar el check de accesos", "alter table accesos drop constraint if exists accesos_que_check"],
  [
    "el check de accesos, con cambio_el_pais",
    `alter table accesos add constraint accesos_que_check
       check (que in ('abrio_la_segunda_puerta', 'cerro_una_puerta', 'cambio_la_clave',
                      'dio_de_baja_un_adulto', 'borro_la_charla', 'cambio_el_pais'))`,
  ],
  [
    "el comentario de la columna",
    `comment on column familias.pais is
       'A que pais se deriva esta familia: decide los telefonos de ayuda, los organismos y los articulos que se citan. NO decide el idioma. Lo elige quien crea la cuenta y se puede cambiar desde el panel.'`,
  ],
];

const cliente = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});
await cliente.connect();

try {
  /* 🔴 Todo o nada: si un check falla a mitad, una base con la columna puesta y
     sin su restricción es peor que una base sin tocar. */
  await cliente.query("begin");
  for (const [que, sql] of PASOS) {
    await cliente.query(sql);
    console.log("  ✓", que);
  }
  await cliente.query("commit");
  console.log("✓ migración 20 aplicada");
} catch (e) {
  await cliente.query("rollback");
  console.error("✗ nada se aplicó —", e.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
